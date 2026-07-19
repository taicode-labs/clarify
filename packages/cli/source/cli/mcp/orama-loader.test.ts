import { mkdtempSync, readdirSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { McpSiteConfig } from '../../plugins/mcp-search/mcp-config.js'
import { buildSearchIndex, serializeSearchIndex, type McpSearchDb } from '../../plugins/mcp-search/orama-index.js'
import type { ContentRoute } from '../../types.js'

import { loadSearchIndex, purgeSiteCache } from './orama-loader.js'

function makeConfig(overrides: Partial<McpSiteConfig['capabilities']['search']> = {}, siteOverrides: Partial<McpSiteConfig['site']> = {}): McpSiteConfig {
  return {
    version: 3,
    site: { title: 'Test Docs', routePrefix: '/', ...siteOverrides },
    capabilities: {
      search: {
        type: 'search',
        indexPath: '/mcp-search.msp',
        defaultLocale: 'zh-CN',
        documentCount: 1,
        locales: ['zh-CN'],
        ...overrides,
      },
    },
  }
}

function makeRoute(): ContentRoute {
  return {
    path: '/zh-CN/guide',
    locale: 'zh-CN',
    isBareAlias: false,
    meta: { title: '快速入门', description: '指南', keywords: ['入门'], sections: [] },
    source: { filePath: '/tmp/guide.md', content: '这是文档正文，介绍 Clarify 快速入门。' },
    kind: 'page',
    module: { virtualModuleId: 'test' },
  } as ContentRoute
}

/** Build a real Orama index from the test route and serialize it to bytes. */
function buildTestIndex(): { db: McpSearchDb; buffer: Uint8Array } {
  const { db } = buildSearchIndex([makeRoute()], 'zh-CN')
  return { db, buffer: serializeSearchIndex(db) }
}

describe('loadSearchIndex', () => {
  let tempDir: string
  let fetchImpl: ReturnType<typeof vi.fn<typeof fetch>>

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-orama-loader-'))
    const { buffer } = buildTestIndex()
    fetchImpl = vi.fn<typeof fetch>(async (url) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u.endsWith('mcp-search.msp')) {
        return new Response(buffer as BodyInit, { status: 200, headers: { 'content-type': 'application/octet-stream' } })
      }
      return new Response('not found', { status: 404 })
    })
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('fetches the remote index and returns searchable results', async () => {
    const loaded = await loadSearchIndex('https://docs.example.com', makeConfig(), {
      cacheDir: tempDir,
      fetchImpl,
      log: () => {},
    })

    const result = loaded.search({ query: '文档' })
    expect(result.count).toBeGreaterThan(0)
    expect(result.hits[0].path).toBe('/zh-CN/guide')
    expect(result.hits[0].title).toBe('快速入门')

    loaded.dispose()
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('caches the index on disk and reuses it on the second load', async () => {
    const config = makeConfig()
    await loadSearchIndex('https://docs.example.com', config, { cacheDir: tempDir, fetchImpl, log: () => {} })

    // Second load should NOT call fetch (cache hit).
    const loaded2 = await loadSearchIndex('https://docs.example.com', config, { cacheDir: tempDir, fetchImpl, log: () => {} })
    const result = loaded2.search({ query: '文档' })
    expect(result.count).toBeGreaterThan(0)
    loaded2.dispose()

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    // The cache directory should now contain a site subdirectory holding the
    // cached .msp file.
    const siteDirs = readdirSync(tempDir)
    expect(siteDirs.length).toBe(1)
    expect(existsSync(join(tempDir, siteDirs[0], 'mcp-search.msp'))).toBe(true)
  })

  it('refetches when documentCount changes (cache stale)', async () => {
    const config = makeConfig({ documentCount: 1 })
    await loadSearchIndex('https://docs.example.com', config, { cacheDir: tempDir, fetchImpl, log: () => {} })
    expect(fetchImpl).toHaveBeenCalledTimes(1)

    // Same site, different documentCount -> cache stale.
    const config2 = makeConfig({ documentCount: 99 })
    await loadSearchIndex('https://docs.example.com', config2, { cacheDir: tempDir, fetchImpl, log: () => {} })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('refetches when the locale set changes (cache stale)', async () => {
    const config = makeConfig({ locales: ['zh-CN'] })
    await loadSearchIndex('https://docs.example.com', config, { cacheDir: tempDir, fetchImpl, log: () => {} })
    expect(fetchImpl).toHaveBeenCalledTimes(1)

    // Same count, different locales -> fingerprint changes -> refetch.
    const config2 = makeConfig({ locales: ['zh-CN', 'en-US'] })
    await loadSearchIndex('https://docs.example.com', config2, { cacheDir: tempDir, fetchImpl, log: () => {} })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('skips cache when noCache is true', async () => {
    const config = makeConfig()
    await loadSearchIndex('https://docs.example.com', config, { cacheDir: tempDir, fetchImpl, log: () => {} })
    await loadSearchIndex('https://docs.example.com', config, { cacheDir: tempDir, fetchImpl, noCache: true, log: () => {} })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('throws on invalid site URL', async () => {
    await expect(
      loadSearchIndex('not-a-url', makeConfig(), { cacheDir: tempDir, fetchImpl, log: () => {} }),
    ).rejects.toThrow(/Invalid site URL/)
  })

  it('throws on HTTP error fetching the index', async () => {
    const failingFetch = vi.fn(async () => new Response('server error', { status: 500 }))
    await expect(
      loadSearchIndex('https://docs.example.com', makeConfig(), { cacheDir: tempDir, fetchImpl: failingFetch, log: () => {} }),
    ).rejects.toThrow(/HTTP 500/)
  })

  it('handles routePrefix in indexPath', async () => {
    const config = makeConfig({}, { routePrefix: '/docs' })
    // indexPath is derived from routePrefix in createMcpSiteConfig, but we can
    // also set it directly to verify the loader resolves it against the base.
    config.capabilities.search!.indexPath = '/docs/mcp-search.msp'

    const loaded = await loadSearchIndex('https://docs.example.com', config, { cacheDir: tempDir, fetchImpl, log: () => {} })
    const result = loaded.search({ query: '文档' })
    expect(result.count).toBeGreaterThan(0)
    loaded.dispose()

    // The fetch URL should include the /docs prefix.
    const calledUrl = fetchImpl.mock.calls[0][0] as string
    expect(calledUrl).toContain('/docs/mcp-search.msp')
  })

  it('dispose prevents further searches', async () => {
    const loaded = await loadSearchIndex('https://docs.example.com', makeConfig(), { cacheDir: tempDir, fetchImpl, log: () => {} })
    loaded.dispose()
    expect(() => loaded.search({ query: '文档' })).toThrow(/disposed/)
  })
})

describe('purgeSiteCache', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-orama-purge-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('removes the cache directory for a site', async () => {
    const { buffer } = buildTestIndex()
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(buffer as BodyInit, { status: 200 }))
    await loadSearchIndex('https://docs.example.com', makeConfig(), { cacheDir: tempDir, fetchImpl, log: () => {} })

    // Cache directory should exist now.
    const entries = existsSync(tempDir)
    expect(entries).toBe(true)

    await purgeSiteCache('https://docs.example.com', tempDir)

    // After purge, a fresh load must refetch.
    const fetchImpl2 = vi.fn<typeof fetch>(async () => new Response(buffer as BodyInit, { status: 200 }))
    await loadSearchIndex('https://docs.example.com', makeConfig(), { cacheDir: tempDir, fetchImpl: fetchImpl2, log: () => {} })
    expect(fetchImpl2).toHaveBeenCalledTimes(1)
  })
})
