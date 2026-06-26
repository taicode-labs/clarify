import { describe, expect, it } from 'vitest'

import { resolveThemeConfig } from '../../core/theme.js'
import type { ContentRoute, ResolvedProjectConfig } from '../../types.js'

import { attachContentArtifactUrls, createLlmsTxt, createLlmsTxtArtifact, readRouteArtifactContent, readRouteContent } from './artifacts.js'

function route(overrides: Partial<ContentRoute>): ContentRoute {
  return {
    path: '/',
    title: 'Home',
    filePath: '/tmp/index.mdx',
    virtualModuleId: 'virtual:clarify-page/index',
    kind: 'mdx',
    ...overrides,
  }
}

describe('content artifact helpers', () => {
  it('adds stable artifact URLs to markdown and OpenAPI routes', () => {
    const routes = [
      route({ path: '/', filePath: '/tmp/index.mdx' }),
      route({ path: '/guide/start', filePath: '/tmp/guide/start.mdx' }),
      route({ path: '/api', filePath: '/tmp/api.openapi.yaml', kind: 'openapi' }),
    ]

    attachContentArtifactUrls(routes)

    expect(routes.map(route => route.contentArtifactUrl)).toEqual([
      '/index.md',
      '/guide/start.md',
      '/api.openapi.json',
    ])
  })

  it('returns route-normalized content via readRouteContent', () => {
    const r = route({ path: '/guide', content: '# Guide' })
    expect(readRouteContent(r)).toBe('# Guide')
  })

  it('reads artifact content with a UTF-8 signature for non-ASCII text', () => {
    const r = route({ path: '/guide', content: '# 快速开始\n\n中文内容' })
    expect(readRouteContent(r)).toBe('# 快速开始\n\n中文内容')
    expect(readRouteArtifactContent(r)).toBe('\uFEFF# 快速开始\n\n中文内容')
  })

  it('reads artifact content without a UTF-8 signature for ASCII-only text', () => {
    const r = route({ path: '/guide', content: '# Getting Started' })
    expect(readRouteArtifactContent(r)).toBe('# Getting Started')
  })

  it('creates an llms.txt sitemap with markdown and OpenAPI links', () => {
    const config: ResolvedProjectConfig = {
      title: 'Docs',
      description: 'Helpful docs',
      routePrefix: '/docs',
      theme: resolveThemeConfig(),
    }
    const routes = [
      route({ path: '/guide', title: 'Guide', contentArtifactUrl: '/guide.md' }),
      route({ path: '/api', title: 'API', kind: 'openapi', contentArtifactUrl: '/api.openapi.json' }),
    ]

    expect(createLlmsTxt(routes, config)).toContain('- [Guide](/docs/guide.md)')
    expect(createLlmsTxt(routes, config)).toContain('- [API](/docs/api.openapi.json)')
  })

  it('creates llms.txt artifacts with a UTF-8 signature when they contain non-ASCII text', () => {
    const config: ResolvedProjectConfig = {
      title: '文档',
      description: '中文说明',
      routePrefix: '/',
      theme: resolveThemeConfig(),
    }
    const routes = [route({ path: '/guide', title: '快速开始', contentArtifactUrl: '/guide.md' })]

    expect(createLlmsTxtArtifact(routes, config).startsWith('\uFEFF# 文档')).toBe(true)
  })
})
