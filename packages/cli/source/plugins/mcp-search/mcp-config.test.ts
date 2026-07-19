import { describe, expect, it } from 'vitest'

import type { ResolvedProjectConfig } from '../../types.js'

import { createMcpSiteConfig } from './mcp-config.js'

function makeProjectConfig(overrides: Partial<ResolvedProjectConfig> = {}): ResolvedProjectConfig {
  return {
    title: 'Test Docs',
    description: 'A test site',
    siteUrl: 'https://docs.example.com',
    routePrefix: '/',
    features: { search: { enabled: true, mcp: true } },
    ...overrides,
  } as never
}

describe('createMcpSiteConfig', () => {
  it('assembles MCP config pointing at the Orama binary index', () => {
    const config = createMcpSiteConfig(
      makeProjectConfig({
        locales: { default: 'zh-cn', missing: 'fallback', locales: [{ code: 'zh-cn', label: '简体中文' }, { code: 'en-us', label: 'English' }] } as never,
      }),
      { documentCount: 42, locales: ['zh-cn', 'en-us'] },
    )

    expect(config).toEqual({
      version: 3,
      site: {
        title: 'Test Docs',
        description: 'A test site',
        url: 'https://docs.example.com',
        routePrefix: '/',
      },
      capabilities: {
        search: {
          type: 'search',
          indexPath: '/mcp-search.msp',
          defaultLocale: 'zh-cn',
          documentCount: 42,
          locales: ['zh-cn', 'en-us'],
        },
      },
    })
  })

  it('prefixes indexPath with routePrefix when site is mounted on a subpath', () => {
    const config = createMcpSiteConfig(
      makeProjectConfig({ routePrefix: '/docs' }),
      { documentCount: 1, locales: ['en-us'] },
    )
    expect(config.capabilities.search?.indexPath).toBe('/docs/mcp-search.msp')
  })

  it('falls back to /mcp-search.msp when routePrefix is "/"', () => {
    const config = createMcpSiteConfig(
      makeProjectConfig({ routePrefix: '/' }),
      { documentCount: 1, locales: ['en-us'] },
    )
    expect(config.capabilities.search?.indexPath).toBe('/mcp-search.msp')
  })

  it('omits defaultLocale when locales config is absent', () => {
    const config = createMcpSiteConfig(makeProjectConfig(), { documentCount: 1, locales: ['en-us'] })
    expect(config.capabilities.search?.defaultLocale).toBeUndefined()
  })

  it('preserves an empty locale list when no locales are indexed', () => {
    const config = createMcpSiteConfig(makeProjectConfig(), { documentCount: 0, locales: [] })
    expect(config.capabilities.search?.locales).toEqual([])
    expect(config.capabilities.search?.documentCount).toBe(0)
  })
})
