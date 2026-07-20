import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

import type { McpSiteConfig } from '../../plugins/mcp-search/mcp-config.js'
import type { McpSearchResult } from '../../plugins/mcp-search/orama-index.js'
import { deserializeSearchIndex, searchMcpIndex } from '../../plugins/mcp-search/orama-index.js'

/**
 * A ready-to-search Orama index loaded for the MCP server.
 *
 * The underlying db is fully in-memory after load, so `search` is synchronous
 * to the index. `dispose` drops the reference so the buffer can be GC'd; it's
 * safe to call multiple times.
 */
export type LoadedSearchIndex = {
  /** Search the index. Locale filter is optional. */
  search: (params: { query: string; locale?: string; limit?: number }) => McpSearchResult
  /** Release the in-memory index. Safe to call multiple times. */
  dispose: () => void
}

/** Re-export so callers can name the result type without reaching into orama-index. */
export type { McpSearchResult as SearchResult } from '../../plugins/mcp-search/orama-index.js'

export type OramaLoaderOptions = {
  /**
   * Root directory for the on-disk cache. Defaults to `~/.clarify/mcp-cache`.
   * Each site gets a subdirectory keyed by a stable hash of its origin + path.
   */
  cacheDir?: string
  /**
   * Bypass the cache and always fetch fresh. Implies purging the cached copy
   * for this site on a successful refresh.
   */
  noCache?: boolean
  /** Optional fetch override (testing). */
  fetchImpl?: typeof fetch
  /** Optional logger (testing). Defaults to no-op. */
  log?: (message: string) => void
}

const DEFAULT_CACHE_DIR = () => join(homedir(), '.clarify', 'mcp-cache')
const FETCH_TIMEOUT_MS = 60_000

/** Stable per-site cache key. Two URLs with the same origin+path share a cache. */
function siteCacheKey(siteUrl: string): string {
  let url: URL
  try {
    url = new URL(siteUrl)
  } catch {
    throw new Error(`[clarify] Invalid site URL: ${siteUrl}`)
  }
  // Origin + pathname, trailing slash normalized, query/hash ignored.
  // Query/hash are irrelevant for "where does the site live" and would
  // fragment the cache unnecessarily.
  const normalized = `${url.origin}${url.pathname.replace(/\/+$/, '')}`
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16)
}

async function fetchBufferWithTimeout(url: string, fetchImpl: typeof fetch, log: (m: string) => void): Promise<Uint8Array> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    log(`Fetching ${url}`)
    const res = await fetchImpl(url, { signal: controller.signal, redirect: 'follow' })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} fetching ${url}`)
    }
    const buf = await res.arrayBuffer()
    return new Uint8Array(buf)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Load the Orama binary index for a remote site and return a ready-to-search
 * handle.
 *
 * The `.msp` index is a single versioned binary file containing a
 * Brotli-compressed, MessagePack-serialized Orama `save()` payload. It is
 * cached on disk so repeated MCP starts don't re-download.
 * Cache validity is keyed by `capabilities.search.indexHash` when available.
 * For older sites that do not emit `indexHash`, we fall back to document
 * count + locale fingerprint matching.
 *
 * The caller must supply the same `defaultLocale` recorded in `mcp.json` so
 * the tokenizer matches the one used at build time. A mismatch would not
 * corrupt data but would cause CJK query terms to be tokenized incorrectly.
 */
export async function loadSearchIndex(siteUrl: string, config: McpSiteConfig, options: OramaLoaderOptions = {}): Promise<LoadedSearchIndex> {
  const log = options.log ?? (() => {})
  const fetchImpl = options.fetchImpl ?? fetch
  const cacheDir = options.cacheDir ?? DEFAULT_CACHE_DIR()
  const cacheKey = siteCacheKey(siteUrl)
  const siteCacheDir = join(cacheDir, cacheKey)
  const indexCachePath = join(siteCacheDir, 'mcp-search.msp')
  const manifestPath = join(siteCacheDir, 'manifest.json')

  const base = new URL(siteUrl).href
  log(`Site base resolved to ${base}`)

  // The index path in mcp.json is root-relative (e.g. `/mcp-search.msp` or
  // `/docs/mcp-search.msp`). Resolve it against the site base.
  const search = config.capabilities.search
  if (!search) {
    throw new Error(`[clarify] mcp.json for ${siteUrl} has no search capability.`)
  }
  const indexUrl = new URL(search.indexPath, base).href

  // Cache validity: reuse the cached .msp only when the document count and
  // locale fingerprint recorded at last fetch match the caller-provided
  // config. These change whenever the index is rebuilt with different content.
  const fingerprint = localeFingerprint(config)
  const indexHash = search.indexHash
  let useCache = !options.noCache
  if (useCache) {
    try {
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
        documentCount?: number
        fingerprint?: string
        indexHash?: string
      }
      if (indexHash) {
        if (manifest.indexHash !== indexHash) {
          log('Cache stale (index hash changed); refetching')
          useCache = false
        }
      } else if (manifest.documentCount !== search.documentCount || manifest.fingerprint !== fingerprint) {
        log('Cache stale (document count or locales changed); refetching')
        useCache = false
      }
    } catch {
      useCache = false
    }
  }

  let buffer: Uint8Array | undefined
  if (useCache) {
    try {
      buffer = await readFile(indexCachePath)
      log('Using cached mcp-search.msp')
    } catch {
      // Cache file unreadable; fall through to fetch below.
    }
  }

  if (buffer === undefined) {
    const fetched = await fetchBufferWithTimeout(indexUrl, fetchImpl, log)
    buffer = fetched
    // Best-effort persist; failure to cache is non-fatal.
    try {
      await mkdir(siteCacheDir, { recursive: true })
      await writeFile(indexCachePath, fetched)
      await writeFile(
        manifestPath,
        JSON.stringify(
          {
            siteUrl: base,
            fetchedAt: new Date().toISOString(),
            documentCount: search.documentCount,
            fingerprint,
            indexHash,
          },
          null,
          2,
        ),
        'utf8',
      )
      log(`Cached mcp-search.msp to ${indexCachePath}`)
    } catch (err) {
      log(`Warning: failed to cache index: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const defaultLocale = search.defaultLocale
  const db = deserializeSearchIndex(buffer, defaultLocale)
  let disposed = false

  return {
    search: ({ query, locale, limit }) => {
      if (disposed) throw new Error('[clarify] Search index already disposed.')
      return searchMcpIndex(db, { query, locale, limit })
    },
    dispose: () => {
      // Orama's in-memory index is plain JS data; dropping the reference is
      // enough for GC. Nothing to flush.
      disposed = true
    },
  }
}

/**
 * Build a stable fingerprint of the indexed locales so the cache can detect
 * locale-set changes even when the document count happens to stay the same.
 */
function localeFingerprint(config: McpSiteConfig): string {
  return createHash('sha256').update((config.capabilities.search?.locales ?? []).slice().sort().join('|')).digest('hex').slice(0, 16)
}

/**
 * Remove the on-disk cache for a site. Useful for `--no-cache` cleanup or for
 * tests. No-op if the site has no cache directory.
 */
export async function purgeSiteCache(siteUrl: string, cacheDir?: string): Promise<void> {
  const dir = cacheDir ?? DEFAULT_CACHE_DIR()
  const key = siteCacheKey(siteUrl)
  await rm(join(dir, key), { recursive: true, force: true })
}
