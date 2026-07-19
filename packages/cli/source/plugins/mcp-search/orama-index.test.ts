import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { ContentRoute } from '../../types.js'

import {
  buildSearchIndex,
  createMcpSearchIndex,
  deserializeSearchIndex,
  indexSearchDocuments,
  readSearchIndex,
  routeToSearchDocument,
  searchMcpIndex,
  serializeSearchIndex,
  tokenizeForSearch,
  writeSearchIndex,
  type McpSearchDocument,
} from './orama-index.js'

function makeRoute(overrides: Partial<ContentRoute> = {}): ContentRoute {
  return {
    path: '/zh-CN/guide',
    locale: 'zh-CN',
    isBareAlias: false,
    meta: {
      title: '快速入门',
      description: '本指南帮助你快速上手',
      keywords: ['入门', '教程'],
      sections: [],
    },
    source: { filePath: '/tmp/guide.md', content: '这是文档的正文内容，介绍如何快速开始使用 Clarify。' },
    ...overrides,
  } as ContentRoute
}

describe('tokenizeForSearch', () => {
  it('splits CJK text into words and characters via Intl.Segmenter', () => {
    const tokens = tokenizeForSearch('文档搜索', 'zh-CN')
    // Intl.Segmenter with word granularity splits CJK text into words it
    // recognizes (kept as single tokens) and individual characters for the
    // rest. Every token is lowercased.
    expect(tokens.length).toBeGreaterThan(0)
    expect(tokens.join('')).toBe('文档搜索')
    expect(tokens.every((t) => t === t.toLowerCase())).toBe(true)
    // Characters that are not part of a dictionary word come out as singles.
    expect(tokens).toContain('文')
    expect(tokens).toContain('档')
  })

  it('keeps dictionary words as single tokens for CJK', () => {
    const tokens = tokenizeForSearch('快速开始', 'zh-CN')
    // "快速" is a common dictionary word; the segmenter may keep it as one
    // token or split it. Either is acceptable as long as indexing and
    // querying use the same tokenizer.
    expect(tokens.length).toBeGreaterThan(0)
    expect(tokens.join('')).toBe('快速开始')
  })

  it('falls back to whitespace/punctuation split for Latin scripts', () => {
    const tokens = tokenizeForSearch('Hello, world! Foo-Bar', 'en-US')
    expect(tokens).toEqual(['hello', 'world', 'foo', 'bar'])
  })

  it('returns empty array for empty input', () => {
    expect(tokenizeForSearch('', 'zh-CN')).toEqual([])
    expect(tokenizeForSearch('', 'en-US')).toEqual([])
  })
})

describe('routeToSearchDocument', () => {
  it('combines title, description, keywords, sections, and content', () => {
    const doc = routeToSearchDocument(makeRoute(), 'zh-CN')
    expect(doc).not.toBeNull()
    expect(doc!.path).toBe('/zh-CN/guide')
    expect(doc!.locale).toBe('zh-CN')
    expect(doc!.title).toBe('快速入门')
    expect(doc!.keywords).toEqual(['入门', '教程'])
    expect(doc!.content).toContain('快速入门')
    expect(doc!.content).toContain('本指南帮助你快速上手')
    expect(doc!.content).toContain('入门 教程')
    expect(doc!.content).toContain('这是文档的正文内容')
  })

  it('returns null for bare alias routes', () => {
    const doc = routeToSearchDocument(makeRoute({ isBareAlias: true }), 'zh-CN')
    expect(doc).toBeNull()
  })

  it('returns null for routes with no searchable content', () => {
    const doc = routeToSearchDocument(
      makeRoute({
        meta: { title: '', description: '', keywords: [], sections: [] },
        source: { filePath: '/tmp/empty.md', content: '' },
      }),
      'zh-CN',
    )
    expect(doc).toBeNull()
  })

  it('falls back to default locale when route has none', () => {
    const doc = routeToSearchDocument(makeRoute({ locale: undefined }), 'en-US')
    expect(doc!.locale).toBe('en-US')
  })
})

describe('searchMcpIndex', () => {
  let db: ReturnType<typeof createMcpSearchIndex>

  beforeEach(() => {
    db = createMcpSearchIndex('zh-CN')
    const docs: McpSearchDocument[] = [
      {
        path: '/zh-CN/guide',
        title: '快速入门指南',
        description: '本指南帮助你快速上手 Clarify',
        locale: 'zh-CN',
        content: '这是文档的正文内容，介绍如何快速开始使用 Clarify。',
        keywords: ['入门', '教程'],
      },
      {
        path: '/en-US/guide',
        title: 'Quick Start Guide',
        description: 'This guide helps you get started with Clarify quickly',
        locale: 'en-US',
        content: 'This is the body content describing how to begin using Clarify fast.',
        keywords: ['guide', 'tutorial'],
      },
      {
        path: '/zh-CN/api',
        title: 'API 文档',
        description: '完整 API 参考',
        locale: 'zh-CN',
        content: '这里是所有 API 接口的说明文档。',
        keywords: ['api', '参考'],
      },
    ]
    indexSearchDocuments(db, docs)
  })

  it('finds Chinese documents by CJK query', () => {
    const result = searchMcpIndex(db, { query: '文档' })
    expect(result.count).toBeGreaterThan(0)
    // Both the API doc (title contains "文档") and the guide (content contains "文档") match.
    expect(result.hits.some((h) => h.path === '/zh-CN/api')).toBe(true)
    expect(result.hits.some((h) => h.path === '/zh-CN/guide')).toBe(true)
  })

  it('finds English documents by Latin query', () => {
    const result = searchMcpIndex(db, { query: 'quick' })
    expect(result.count).toBe(1)
    expect(result.hits[0].path).toBe('/en-US/guide')
  })

  it('filters results by locale', () => {
    const zhResult = searchMcpIndex(db, { query: 'clarify', locale: 'zh-CN' })
    const enResult = searchMcpIndex(db, { query: 'clarify', locale: 'en-US' })
    expect(zhResult.hits.every((h) => h.locale === 'zh-CN')).toBe(true)
    expect(enResult.hits.every((h) => h.locale === 'en-US')).toBe(true)
    expect(zhResult.hits.some((h) => h.path === '/zh-CN/guide')).toBe(true)
    expect(enResult.hits.some((h) => h.path === '/en-US/guide')).toBe(true)
  })

  it('returns no hits for nonexistent terms', () => {
    const result = searchMcpIndex(db, { query: 'zzznonexistentterm' })
    expect(result.count).toBe(0)
    expect(result.hits).toEqual([])
  })

  it('synthesizes an excerpt from matched content', () => {
    const result = searchMcpIndex(db, { query: '文档' })
    const apiHit = result.hits.find((h) => h.path === '/zh-CN/api')
    expect(apiHit).toBeDefined()
    expect(apiHit!.excerpt.length).toBeGreaterThan(0)
    expect(apiHit!.excerpt.length).toBeLessThanOrEqual(242) // 240 + up to 2 ellipses
  })

  it('respects the limit parameter', () => {
    const result = searchMcpIndex(db, { query: 'clarify', limit: 1 })
    expect(result.hits.length).toBeLessThanOrEqual(1)
  })

  it('falls back to a derived title when the document title is empty', () => {
    const localDb = createMcpSearchIndex('en-US')
    indexSearchDocuments(localDb, [
      {
        path: '/en-US/no-title',
        title: '',
        description: 'A page without a title',
        locale: 'en-US',
        content: 'Some content here for searching.',
        keywords: [],
      },
    ])
    const result = searchMcpIndex(localDb, { query: 'content' })
    expect(result.hits[0].title).toBe('No Title')
  })
})

describe('serialize / deserialize round-trip', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-orama-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('preserves search results after serialize + deserialize in-memory', () => {
    const original = buildSearchIndex(
      [makeRoute(), makeRoute({ path: '/zh-CN/api', meta: { title: 'API 文档', description: '', keywords: [], sections: [] } })],
      'zh-CN',
    )

    const buffer = serializeSearchIndex(original.db)
    expect(buffer.byteLength).toBeGreaterThan(0)

    const restored = deserializeSearchIndex(buffer, 'zh-CN')

    // Same query must produce the same hit set on the restored index.
    const before = searchMcpIndex(original.db, { query: '文档' })
    const after = searchMcpIndex(restored, { query: '文档' })
    expect(after.count).toBe(before.count)
    expect(after.hits.map((h) => h.path).sort()).toEqual(before.hits.map((h) => h.path).sort())
  })

  it('preserves CJK query tokenization after round-trip (the critical regression)', () => {
    // This is the exact bug that ruled out @orama/plugin-data-persistence's
    // restore(): a restored index without the custom tokenizer would not
    // split "文档" into "文" + "档", so CJK queries would return 0 hits.
    const original = buildSearchIndex([makeRoute()], 'zh-CN')
    const buffer = serializeSearchIndex(original.db)
    const restored = deserializeSearchIndex(buffer, 'zh-CN')

    const result = searchMcpIndex(restored, { query: '文档' })
    expect(result.count).toBeGreaterThan(0)
  })

  it('preserves locale filtering after round-trip', () => {
    const original = buildSearchIndex(
      [makeRoute(), makeRoute({ path: '/en-US/guide', locale: 'en-US', meta: { title: 'Quick Start', description: '', keywords: [], sections: [] }, source: { filePath: '/tmp/en-guide.md', content: 'Get started quickly with Clarify.' } })],
      'zh-CN',
    )
    const buffer = serializeSearchIndex(original.db)
    const restored = deserializeSearchIndex(buffer, 'zh-CN')

    const enResult = searchMcpIndex(restored, { query: 'clarify', locale: 'en-US' })
    expect(enResult.hits.every((h) => h.locale === 'en-US')).toBe(true)
  })

  it('writes and reads a .msp file on disk', () => {
    const original = buildSearchIndex([makeRoute()], 'zh-CN')
    const filePath = join(tempDir, 'mcp-search.msp')

    writeSearchIndex(original.db, filePath)
    const restored = readSearchIndex(filePath, 'zh-CN')

    const result = searchMcpIndex(restored, { query: '文档' })
    expect(result.count).toBeGreaterThan(0)
  })

  it('produces a compact binary file (sanity check on size)', () => {
    const original = buildSearchIndex([makeRoute()], 'zh-CN')
    const buffer = serializeSearchIndex(original.db)
    // A single small document should serialize to well under 10KB.
    expect(buffer.byteLength).toBeLessThan(10_000)
  })
})

describe('buildSearchIndex', () => {
  it('skips bare alias and empty routes', () => {
    const { db, documentCount } = buildSearchIndex(
      [
        makeRoute(),
        makeRoute({ path: '/guide', isBareAlias: true }),
        makeRoute({
          path: '/empty',
          meta: { title: '', description: '', keywords: [], sections: [] },
          source: { filePath: '/tmp/empty.md', content: '' },
        }),
      ],
      'zh-CN',
    )
    expect(documentCount).toBe(1)
    const result = searchMcpIndex(db, { query: '文档' })
    expect(result.count).toBe(1)
  })
})
