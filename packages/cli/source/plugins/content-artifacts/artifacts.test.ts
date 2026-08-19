import { describe, expect, it } from 'vitest'

import { resolveFeaturesConfig } from '../../core/config/config.js'
import { resolveThemeConfig } from '../../parsers/theme.js'
import type { ContentRoute, MarkdownContentRoute, OpenAPIContentRoute, ResolvedProjectConfig } from '../../types.js'

import { attachContentArtifactUrls, createLlmsTxt, createLlmsTxtArtifact, createRootOpenAPISpec, readRouteArtifactContent, readRouteContent } from './artifacts.js'

const projectConfig: ResolvedProjectConfig = {
  title: 'Docs',
  description: '',
  routePrefix: '',
  assetPrefix: '/',
  theme: resolveThemeConfig(),
  variables: {},
  features: resolveFeaturesConfig(),
}

type RouteFixture = Partial<Omit<ContentRoute, 'kind' | 'meta' | 'module' | 'source' | 'openapi'>> & {
  kind?: ContentRoute['kind']
  title?: string
  description?: string
  sections?: ContentRoute['meta']['sections']
  filePath?: string
  content?: string
  tagFilter?: string[]
}

function route(overrides: RouteFixture): ContentRoute {
  const { title, description, sections, filePath, content, tagFilter, kind = 'markdown+jsx', ...rest } = overrides
  const common = {
    path: '/',
    meta: {
      title: title ?? 'Home',
      description,
      sections,
    },
    source: {
      filePath: filePath ?? '/tmp/index.mdx',
      content,
    },
    ...rest,
  }

  if (kind === 'openapi') {
    return { ...common, kind, module: { pageVirtualModuleId: 'virtual:clarify-page/index' }, openapi: { tagFilter } } satisfies OpenAPIContentRoute
  }

  return {
    ...common,
    kind,
    module: {
      pageVirtualModuleId: 'virtual:clarify-page/index',
      contentVirtualModuleId: 'virtual:clarify-content/index.mdx',
    },
  } satisfies MarkdownContentRoute
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

  it('aggregates complete OpenAPI sources into a root document', () => {
    const first = JSON.stringify({
      openapi: '3.1.0',
      info: { title: 'Users', version: '1.0.0' },
      paths: { '/users': { get: { responses: { 200: { description: 'OK' } } } } },
      components: { schemas: { User: { type: 'object' } } },
      tags: [{ name: 'Users' }],
    })
    const second = JSON.stringify({
      openapi: '3.1.1',
      info: { title: 'Projects', version: '1.0.0' },
      paths: { '/projects': { get: { responses: { 200: { description: 'OK' } } } } },
      components: { schemas: { Project: { type: 'object' } } },
      tags: [{ name: 'Projects' }],
    })

    const spec = createRootOpenAPISpec([
      route({ path: '/users', kind: 'openapi', filePath: '/tmp/users.openapi.json', content: first }),
      route({ path: '/projects', kind: 'openapi', filePath: '/tmp/projects.openapi.json', content: second }),
    ], { ...projectConfig, title: 'Platform API', description: 'All endpoints.' })

    expect(spec.info).toEqual({ title: 'Platform API', description: 'All endpoints.', version: '1.0.0' })
    expect(spec.paths).toEqual({
      '/users': { get: { responses: { 200: { description: 'OK' } } } },
      '/projects': { get: { responses: { 200: { description: 'OK' } } } },
    })
    expect(spec.components?.schemas).toEqual({ User: { type: 'object' }, Project: { type: 'object' } })
    expect(spec.tags).toEqual([{ name: 'Users' }, { name: 'Projects' }])
  })

  it('uses each full source once and excludes filtered, alias, and non-default locale routes', () => {
    const spec = (path: string) => JSON.stringify({
      openapi: '3.1.0',
      info: { title: path, version: '1.0.0' },
      paths: { [path]: { get: { responses: { 200: { description: 'OK' } } } } },
    })
    const config = {
      ...projectConfig,
      locales: {
        default: 'zh-CN',
        missing: 'fallback' as const,
        locales: [{ code: 'zh-CN', label: '简体中文' }, { code: 'en-US', label: 'English' }],
      },
    }

    const rootSpec = createRootOpenAPISpec([
      route({ path: '/api', kind: 'openapi', locale: 'zh-CN', filePath: '/tmp/zh-CN/api.openapi.json', content: spec('/api') }),
      route({ path: '/reference', kind: 'openapi', locale: 'zh-CN', filePath: '/tmp/zh-CN/api.openapi.json', content: spec('/api') }),
      route({ path: '/api/projects', kind: 'openapi', locale: 'zh-CN', filePath: '/tmp/zh-CN/api.openapi.json', content: spec('/projects'), tagFilter: ['Projects'] }),
      route({ path: '/', kind: 'openapi', isBareAlias: true, filePath: '/tmp/zh-CN/api.openapi.json', content: spec('/api') }),
      route({ path: '/en-US/api', kind: 'openapi', locale: 'en-US', filePath: '/tmp/en-US/api.openapi.json', content: spec('/english') }),
    ], config)

    expect(rootSpec.paths).toEqual({ '/api': { get: { responses: { 200: { description: 'OK' } } } } })
  })

  it('rejects incompatible versions and conflicting entries', () => {
    const spec = (version: string, path: string, description: string) => JSON.stringify({
      openapi: version,
      info: { title: path, version: '1.0.0' },
      paths: { [path]: { get: { responses: { 200: { description } } } } },
    })

    expect(() => createRootOpenAPISpec([
      route({ kind: 'openapi', filePath: '/tmp/v3.openapi.json', content: spec('3.0.3', '/users', 'OK') }),
      route({ kind: 'openapi', filePath: '/tmp/v31.openapi.json', content: spec('3.1.0', '/projects', 'OK') }),
    ], projectConfig)).toThrow('incompatible versions')

    expect(() => createRootOpenAPISpec([
      route({ kind: 'openapi', filePath: '/tmp/first.openapi.json', content: spec('3.1.0', '/users', 'First') }),
      route({ kind: 'openapi', filePath: '/tmp/second.openapi.json', content: spec('3.1.1', '/users', 'Second') }),
    ], projectConfig)).toThrow('conflicting paths entry "/users"')
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
