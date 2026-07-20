import { readFileSync, writeFileSync } from 'node:fs'
import { brotliCompressSync, brotliDecompressSync, constants as zlibConstants } from 'node:zlib'

import { decode, encode } from '@msgpack/msgpack'
import { create, insertMultiple, search, save, load } from '@orama/orama'
import type { AnyOrama, Results } from '@orama/orama'

import type { ContentRoute } from '../../types.js'

const MSP_MAGIC = new Uint8Array([0x43, 0x4c, 0x41, 0x52, 0x49, 0x46, 0x59, 0x4d, 0x53, 0x50, 0x01])

function hasMspMagic(buffer: Uint8Array): boolean {
  return buffer.byteLength >= MSP_MAGIC.byteLength
    && MSP_MAGIC.every((byte, index) => buffer[index] === byte)
}

/**
 * Orama schema for the MCP search index.
 *
 * - `path`, `title`, `description`, `content` are full-text searchable strings.
 * - `locale` is an `enum` so we can use `where: { locale: { eq } }` filters at
 *   query time. (`string` fields cannot be filtered in Orama.)
 * - `keywords` is a `string[]` also indexed for full-text matching.
 */
export const mcpSearchSchema = {
  path: 'string',
  title: 'string',
  description: 'string',
  locale: 'enum',
  content: 'string',
  keywords: 'string[]',
} as const

export type McpSearchDocument = {
  path: string
  title: string
  description: string
  locale: string
  content: string
  keywords: string[]
}

/**
 * Intl.Segmenter cache keyed by BCP 47 tag. Segmenter construction is not
 * cheap, and the MCP server issues many queries against the same locale, so
 * we reuse instances. The cache is module-scoped: build and runtime share it
 * in the same process, and separate processes get their own - which is fine.
 */
const segmenterCache = new Map<string, Intl.Segmenter>()

function getSegmenter(locale: string): Intl.Segmenter {
  let seg = segmenterCache.get(locale)
  if (!seg) {
    seg = new Intl.Segmenter(locale, { granularity: 'word' })
    segmenterCache.set(locale, seg)
  }
  return seg
}

/**
 * Map a Clarify locale code (e.g. `zh-CN`, `en-US`, `ja-JP`) to a BCP 47 tag
 * suitable for `Intl.Segmenter`. Returns `null` for locales we intentionally
 * want to tokenize with the Latin/whitespace fallback (faster, and avoids
 * forcing CJK-style word segmentation on Latin scripts).
 */
function segmenterLocale(locale: string | undefined): string | null {
  if (!locale) return null
  const lower = locale.toLowerCase()
  if (lower.startsWith('zh')) return 'zh-CN'
  if (lower.startsWith('ja')) return 'ja-JP'
  if (lower.startsWith('ko')) return 'ko-KR'
  return null
}

/**
 * Tokenize text for Orama indexing and querying.
 *
 * CJK locales use `Intl.Segmenter` (word granularity), which splits
 * spaceless scripts into words and individual characters. Latin/whitespace
 * locales fall back to a Unicode-aware split on spaces and punctuation.
 *
 * All tokens are lowercased so queries match regardless of case.
 */
export function tokenizeForSearch(text: string, locale?: string): string[] {
  if (!text) return []
  const segLocale = segmenterLocale(locale)
  if (segLocale) {
    const seg = getSegmenter(segLocale)
    return Array.from(seg.segment(text))
      .filter((s) => s.isWordLike)
      .map((s) => s.segment.toLowerCase())
  }
  // Latin / default: split on whitespace + punctuation, drop empties.
  return text
    .toLowerCase()
    .split(/[\s\p{P}]+/u)
    .filter(Boolean)
}

/**
 * Build an Orama tokenizer component bound to a specific default locale.
 *
 * The tokenizer receives the raw field value and the per-field language hint
 * from Orama (which we don't set per-field, so it falls back to the default
 * language). We resolve the segmenter locale from the default locale at
 * construction time so the same tokenizer handles all documents in a
 * predominantly single-locale index.
 *
 * For multi-locale indexes, the tokenizer is also used at query time. Since
 * the query locale is not known to Orama's tokenizer callback, we use the
 * index's default locale - this is acceptable because:
 *   - CJK queries get CJK segmentation (correct)
 *   - Latin queries against a CJK-default index still work because Latin
 *     text has no word boundaries for CJK segmenters to mis-split; the
 *     segmenter passes through Latin words as-is.
 */
export function createMcpTokenizer(defaultLocale?: string) {
  return {
    language: defaultLocale ?? 'en',
    normalizationCache: new Map<string, string>(),
    tokenize(raw: unknown, language?: string): string[] {
      const text = typeof raw === 'string' ? raw : String(raw ?? '')
      // `language` is Orama's per-field language; fall back to the index default.
      return tokenizeForSearch(text, language ?? defaultLocale)
    },
  }
}

/**
 * Compose the searchable text for a route. Shared between the Pagefind
 * (browser) and Orama (MCP) indexing paths so both backends see the same
 * field order and content.
 */
export function routeSearchContent(route: ContentRoute): string {
  return [
    route.meta.title,
    route.meta.description,
    route.meta.keywords?.join(' '),
    route.meta.sections?.map((section) => section.title).join(' '),
    route.source.content,
  ]
    .filter(Boolean)
    .join('\n\n')
}

/**
 * Convert a `ContentRoute` into the document shape stored in the Orama index.
 */
export function routeToSearchDocument(route: ContentRoute, defaultLocale?: string): McpSearchDocument | null {
  // Skip bare alias routes (e.g. `/path` that just redirects to `/locale/path`)
  // to avoid indexing duplicate content in multilingual sites.
  if (route.isBareAlias) return null

  const content = routeSearchContent(route)
  if (!content.trim()) return null

  return {
    path: route.path,
    title: route.meta.title ?? '',
    description: route.meta.description ?? '',
    locale: route.locale ?? defaultLocale ?? 'en',
    content,
    keywords: route.meta.keywords ?? [],
  }
}

/**
 * Create an Orama index pre-configured with the MCP schema and CJK-aware
 * tokenizer. Both the build step and the runtime loader use this so the
 * tokenizer is guaranteed to match between indexing and querying.
 *
 * Annotated as `AnyOrama` (Orama's exported base type) rather than inferred
 * via `ReturnType<typeof create>` because the inference would pull in
 * Orama's internal component types (`DocumentsStore`, `Index`, `Sorter`)
 * which are not exported and break `.d.ts` generation (TS2883).
 */
export function createMcpSearchIndex(defaultLocale?: string): McpSearchDb {
  return create({
    schema: mcpSearchSchema,
    components: { tokenizer: createMcpTokenizer(defaultLocale) },
  })
}

/** Orama index instance type for the MCP search schema. */
export type McpSearchDb = AnyOrama<typeof mcpSearchSchema>

/**
 * Insert search documents into an Orama index.
 */
export function indexSearchDocuments(db: McpSearchDb, documents: McpSearchDocument[]): void {
  if (documents.length === 0) return
  insertMultiple(db, documents)
}

/**
 * Build a ready-to-search Orama index from content routes.
 *
 * Filters out bare aliases and empty routes. Returns the populated db.
 */
export function buildSearchIndex(routes: ContentRoute[], defaultLocale?: string): { db: McpSearchDb; documentCount: number } {
  const db = createMcpSearchIndex(defaultLocale)
  const documents: McpSearchDocument[] = []
  for (const route of routes) {
    const doc = routeToSearchDocument(route, defaultLocale)
    if (doc) documents.push(doc)
  }
  indexSearchDocuments(db, documents)
  return { db, documentCount: documents.length }
}

/**
 * Collect the distinct locale codes that will be present in the Orama index,
 * in stable insertion order. Bare aliases are skipped (they duplicate the
 * default-locale route). Locales with no code fall back to the project
 * default so single-locale sites still surface one locale.
 */
export function collectIndexedLocales(routes: ContentRoute[], defaultLocale?: string): string[] {
  const seen = new Set<string>()
  const locales: string[] = []
  for (const route of routes) {
    if (route.isBareAlias) continue
    const code = route.locale ?? defaultLocale ?? 'en'
    if (!seen.has(code)) {
      seen.add(code)
      locales.push(code)
    }
  }
  return locales
}

export type McpSearchParams = {
  query: string
  locale?: string
  limit?: number
}

export type McpSearchHit = {
  path: string
  title: string
  description: string
  locale: string
  score: number
  excerpt: string
  keywords: string[]
}

export type McpSearchResult = {
  hits: McpSearchHit[]
  count: number
}

/**
 * Search an Orama MCP index.
 *
 * Applies an optional locale filter (via the `enum` field) and returns a
 * compact, LLM-friendly hit shape. Excerpts are derived from the matched
 * content: Orama does not return highlighted excerpts, so we synthesize a
 * short window around the first query term occurrence.
 */
export function searchMcpIndex(db: McpSearchDb, params: McpSearchParams): McpSearchResult {
  const limit = Math.max(1, Math.min(50, params.limit ?? 10))
  // `search` (the sync variant) returns `Results` at runtime, but its type
  // signature is `Results | Promise<Results>` to also cover `searchAsync`.
  // We assert to `Results` since we intentionally call the sync form.
  const result = search(db, {
    term: params.query,
    limit,
    where: params.locale ? { locale: { eq: params.locale } } : undefined,
  }) as Results<McpSearchDocument>

  const hits: McpSearchHit[] = result.hits.map((hit) => {
    const doc = hit.document as McpSearchDocument
    return {
      path: doc.path,
      title: doc.title || guessTitleFromPath(doc.path),
      description: doc.description,
      locale: doc.locale,
      score: hit.score,
      excerpt: makeExcerpt(doc.content, params.query),
      keywords: doc.keywords,
    }
  })

  return { hits, count: result.count }
}

/**
 * Build a short excerpt around the first occurrence of any query term in the
 * content. Falls back to the beginning of the content if no term is found.
 */
function makeExcerpt(content: string, query: string, maxLen = 240): string {
  if (!content) return ''
  const terms = query
    .toLowerCase()
    .split(/[\s\p{P}]+/u)
    .filter(Boolean)
  const lower = content.toLowerCase()
  let pos = -1
  for (const term of terms) {
    const i = lower.indexOf(term)
    if (i >= 0 && (pos < 0 || i < pos)) pos = i
  }
  if (pos < 0) pos = 0
  // Center the window on the first match, clamped to content bounds.
  const half = Math.floor(maxLen / 2)
  const start = Math.max(0, pos - half)
  const end = Math.min(content.length, start + maxLen)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < content.length ? '…' : ''
  return `${prefix}${content.slice(start, end).trim()}${suffix}`
}

function guessTitleFromPath(path: string): string {
  if (!path) return '(untitled)'
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 0) return 'Home'
  return segments[segments.length - 1]
    .replace(/\.(md|mdx|html)$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Serialize an Orama index to a versioned, Brotli-compressed binary buffer.
 *
 * Uses `save()` to extract the raw index data, MessagePack-encodes it, then
 * compresses the payload so source documents are not embedded as contiguous
 * plaintext. The leading magic bytes identify the container and its version.
 */
export function serializeSearchIndex(db: McpSearchDb): Uint8Array {
  const raw = save(db)
  const packed = encode(raw)
  const compressed = brotliCompressSync(packed, {
    params: {
      [zlibConstants.BROTLI_PARAM_QUALITY]: 9,
    },
  })
  const buffer = new Uint8Array(MSP_MAGIC.byteLength + compressed.byteLength)
  buffer.set(MSP_MAGIC)
  buffer.set(compressed, MSP_MAGIC.byteLength)
  return buffer
}

/**
 * Deserialize a current compressed container or legacy MessagePack buffer
 * into a ready-to-search Orama index.
 *
 * The caller must supply the same `defaultLocale` used when the index was
 * built, so the tokenizer matches. A mismatch would not corrupt data but
 * would cause CJK query terms to be tokenized incorrectly (e.g. "文档" left
 * as a single token instead of split into "文" + "档").
 */
export function deserializeSearchIndex(buffer: Uint8Array, defaultLocale?: string): McpSearchDb {
  const packed = hasMspMagic(buffer)
    ? brotliDecompressSync(buffer.subarray(MSP_MAGIC.byteLength))
    : buffer
  const raw = decode(packed) as ReturnType<typeof save>
  const db = createMcpSearchIndex(defaultLocale)
  load(db, raw)
  return db
}

/**
 * Write an Orama index to a versioned `.msp` file on disk.
 */
export function writeSearchIndex(db: McpSearchDb, filePath: string): void {
  writeFileSync(filePath, serializeSearchIndex(db))
}

/**
 * Read a current or legacy Orama `.msp` index from disk.
 */
export function readSearchIndex(filePath: string, defaultLocale?: string): McpSearchDb {
  return deserializeSearchIndex(readFileSync(filePath), defaultLocale)
}
