import { describe, expect, it, vi } from 'vitest'

import { fetchMcpConfig } from './mcp.js'

function makeConfig(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: 3,
    site: { title: 'Test', routePrefix: '/' },
    capabilities: {
      search: {
        type: 'search',
        indexPath: '/mcp-search.msp',
        indexHash: 'hash-v1',
        defaultLocale: 'en-us',
        documentCount: 5,
        locales: ['en-us'],
      },
    },
    ...overrides,
  }
}

describe('fetchMcpConfig', () => {
  it('fetches and parses mcp.json from the site root', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      expect(url).toBe('https://docs.example.com/mcp.json')
      return new Response(JSON.stringify(makeConfig()), { status: 200 })
    }) as unknown as typeof fetch

    const config = await fetchMcpConfig('https://docs.example.com', fetchImpl, () => {})
    expect(config.version).toBe(3)
    expect(config.capabilities.search?.documentCount).toBe(5)
    expect(config.capabilities.search?.indexPath).toBe('/mcp-search.msp')
  })

  it('resolves mcp.json relative to a site URL with a path', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      expect(url).toBe('https://example.com/docs/mcp.json')
      return new Response(JSON.stringify(makeConfig()), { status: 200 })
    }) as unknown as typeof fetch

    await fetchMcpConfig('https://example.com/docs/', fetchImpl, () => {})
  })

  it('throws on HTTP error', async () => {
    const fetchImpl = vi.fn(async () => new Response('Not Found', { status: 404 })) as unknown as typeof fetch

    await expect(
      fetchMcpConfig('https://docs.example.com', fetchImpl, () => {}),
    ).rejects.toThrow(/Failed to fetch mcp.json.*HTTP 404/)
  })

  it('throws on unsupported schema version', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(makeConfig({ version: 99 })), { status: 200 })) as unknown as typeof fetch

    await expect(
      fetchMcpConfig('https://docs.example.com', fetchImpl, () => {}),
    ).rejects.toThrow(/Unsupported mcp.json schema version 99/)
  })

  it('throws when no documents are indexed', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(makeConfig({ capabilities: { search: { type: 'search', documentCount: 0, locales: [] } } })), { status: 200 })) as unknown as typeof fetch

    await expect(
      fetchMcpConfig('https://docs.example.com', fetchImpl, () => {}),
    ).rejects.toThrow(/no indexed documents/)
  })

  it('throws when indexPath is missing', async () => {
    const fetchImpl = vi.fn(async () => {
      const cfg = makeConfig()
      delete (cfg.capabilities as Record<string, Record<string, unknown>>).search!.indexPath
      return new Response(JSON.stringify(cfg), { status: 200 })
    }) as unknown as typeof fetch

    await expect(
      fetchMcpConfig('https://docs.example.com', fetchImpl, () => {}),
    ).rejects.toThrow(/missing capabilities.search.indexPath/)
  })

  it('throws when indexHash is invalid', async () => {
    const fetchImpl = vi.fn(async () => {
      const cfg = makeConfig()
      ;(cfg.capabilities as Record<string, Record<string, unknown>>).search!.indexHash = ''
      return new Response(JSON.stringify(cfg), { status: 200 })
    }) as unknown as typeof fetch

    await expect(
      fetchMcpConfig('https://docs.example.com', fetchImpl, () => {}),
    ).rejects.toThrow(/invalid capabilities.search.indexHash/)
  })
})
