import { describe, expect, it } from 'vitest'

import { resolveThemeConfig } from '../../parsers/theme.js'
import type { ContentRoute, ResolvedProjectConfig } from '../../types.js'

import { resolveFeaturesConfig } from '../../core/config/config.js'
import { attachContentArtifactUrls, createLlmsTxt, createLlmsTxtArtifact, readRouteArtifactContent, readRouteContent } from './artifacts.js'

type RouteFixture = Partial<Omit<ContentRoute, 'meta' | 'module' | 'source'>> & {
  title?: string
  description?: string
  sections?: ContentRoute['meta']['sections']
  filePath?: string
  content?: string
}

function route(overrides: RouteFixture): ContentRoute {
  const { title, description, sections, filePath, content, ...rest } = overrides
  return {
    path: '/',
    kind: 'mdx',
    meta: {
      title: title ?? 'Home',
      description,
      sections,
    },
    module: { virtualModuleId: 'virtual:clarify-page/index' },
    source: {
      filePath: filePath ?? '/tmp/index.mdx',
      content,
    },
    ...rest,
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

    expect(routes.map(route => route.artifacts?.contentArtifactUrl)).toEqual([
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

  it('creates an llms.txt sitemap with described markdown and OpenAPI links', () => {
    const config: ResolvedProjectConfig = {
      title: 'Docs',
      description: 'Helpful docs',
      routePrefix: '/docs',
      assetPrefix: '/docs/',
      locales: {
        default: 'en-US',
        missing: 'fallback',
        locales: [{ code: 'en-US', label: 'English' }],
      },
      theme: resolveThemeConfig(),
      variables: {},
      features: resolveFeaturesConfig(),
    }
    const routes = [
      route({ path: '/guide', locale: 'en-US', title: 'Guide', description: 'Start here.', artifacts: { contentArtifactUrl: '/guide.md' } }),
      route({ path: '/reference', locale: 'en-US', title: 'Reference', sections: [{ id: 'config', title: 'Config', level: 2 }], artifacts: { contentArtifactUrl: '/reference.md' } }),
      route({ path: '/404', locale: 'en-US', title: '404', artifacts: { contentArtifactUrl: '/404.md' } }),
      route({ path: '/api', title: 'API', kind: 'openapi', artifacts: { contentArtifactUrl: '/api.openapi.json' } }),
    ]

    expect(createLlmsTxt(routes, config)).toContain('## Docs')
    expect(createLlmsTxt(routes, config)).toContain('- [Guide](/docs/guide.md): Start here.')
    expect(createLlmsTxt(routes, config)).toContain('- [Reference](/docs/reference.md): Covers Config.')
    expect(createLlmsTxt(routes, config)).toContain('- [API](/docs/api.openapi.json): OpenAPI artifact for machine-readable API reference data.')
    expect(createLlmsTxt(routes, config)).not.toContain('/404.md')
  })

  it('groups default-locale aliases without a duplicate Default section', () => {
    const config: ResolvedProjectConfig = {
      title: 'Docs',
      description: 'Helpful docs',
      routePrefix: '',
      assetPrefix: '/',
      locales: {
        default: 'zh-CN',
        missing: 'fallback',
        locales: [
          { code: 'zh-CN', label: '简体中文' },
          { code: 'en-US', label: 'English' },
        ],
      },
      theme: resolveThemeConfig(),
      variables: {},
      features: resolveFeaturesConfig(),
    }
    const routes = [
      route({ path: '/zh-CN/guide', basePath: '/guide', locale: 'zh-CN', title: '指南', artifacts: { contentArtifactUrl: '/zh-CN/guide.md' } }),
      route({ path: '/guide', basePath: '/guide', title: '指南', artifacts: { contentArtifactUrl: '/guide.md' } }),
      route({ path: '/en-US/guide', basePath: '/guide', locale: 'en-US', title: 'Guide', artifacts: { contentArtifactUrl: '/en-US/guide.md' } }),
    ]
    const llmsTxt = createLlmsTxt(routes, config)

    expect(llmsTxt).toContain('## Docs - 简体中文')
    expect(llmsTxt).toContain('## Docs - English')
    expect(llmsTxt).not.toContain('## Docs - Default')
    expect(llmsTxt).toContain('- [指南](/guide.md)')
    expect(llmsTxt).not.toContain('/zh-CN/guide.md')
  })

  it('creates llms.txt artifacts with a UTF-8 signature when they contain non-ASCII text', () => {
    const config: ResolvedProjectConfig = {
      title: '文档',
      description: '中文说明',
      routePrefix: '/',
      assetPrefix: '/',
      theme: resolveThemeConfig(),
      variables: {},
      features: resolveFeaturesConfig(),
    }
    const routes = [route({ path: '/guide', title: '快速开始', artifacts: { contentArtifactUrl: '/guide.md' } })]

    expect(createLlmsTxtArtifact(routes, config).startsWith('\uFEFF# 文档')).toBe(true)
  })

  it('excludes bare alias routes from llms.txt in multilingual sites', () => {
    const config: ResolvedProjectConfig = {
      title: 'Docs',
      description: 'Helpful docs',
      routePrefix: '',
      assetPrefix: '/',
      locales: {
        default: 'zh-CN',
        missing: 'fallback',
        locales: [
          { code: 'zh-CN', label: '简体中文' },
          { code: 'en-US', label: 'English' },
        ],
      },
      theme: resolveThemeConfig(),
      variables: {},
      features: resolveFeaturesConfig(),
    }
    const routes = [
      route({ path: '/zh-CN/guide', basePath: '/guide', locale: 'zh-CN', title: 'Guide', artifacts: { contentArtifactUrl: '/zh-CN/guide.md' } }),
      route({ path: '/guide', basePath: '/guide', isBareAlias: true, title: 'Guide', artifacts: { contentArtifactUrl: '/guide.md' } }),
      route({ path: '/en-US/guide', basePath: '/guide', locale: 'en-US', title: 'Guide', artifacts: { contentArtifactUrl: '/en-US/guide.md' } }),
    ]
    const llmsTxt = createLlmsTxt(routes, config)

    // Should include language-prefixed routes
    expect(llmsTxt).toContain('- [Guide](/zh-CN/guide.md)')
    expect(llmsTxt).toContain('- [Guide](/en-US/guide.md)')
    
    // Should exclude bare alias route
    expect(llmsTxt).not.toContain('- [Guide](/guide.md)')
  })
})
