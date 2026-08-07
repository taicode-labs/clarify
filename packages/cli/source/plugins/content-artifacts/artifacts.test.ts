import { describe, expect, it } from 'vitest'

import { resolveFeaturesConfig } from '../../core/config/config.js'
import { resolveThemeConfig } from '../../parsers/theme.js'
import type { ContentRoute, MarkdownContentRoute, OpenAPIContentRoute, ResolvedProjectConfig } from '../../types.js'

import { attachContentArtifactUrls, createLlmsTxt, createLlmsTxtArtifact, createRootOpenAPISpec, readRouteArtifactContent, readRouteContent } from './artifacts.js'

type RouteFixture = Partial<Omit<ContentRoute, 'kind' | 'meta' | 'module' | 'source' | 'openapi'>> & {
  kind?: ContentRoute['kind']
  title?: string
  description?: string
  sections?: ContentRoute['meta']['sections']
  filePath?: string
  content?: string
}

function route(overrides: RouteFixture): ContentRoute {
  const { title, description, sections, filePath, content, kind = 'markdown+jsx', ...rest } = overrides
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
    return { ...common, kind, module: { pageVirtualModuleId: 'virtual:clarify-page/index' } } satisfies OpenAPIContentRoute
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

  it('aggregates unique OpenAPI sources into one root spec', () => {
    const config: ResolvedProjectConfig = {
      title: 'Platform API',
      description: 'All public endpoints.',
      routePrefix: '',
      assetPrefix: '/',
      theme: resolveThemeConfig(),
      variables: {},
      features: resolveFeaturesConfig(),
    }
    const projectsSpec = JSON.stringify({
      openapi: '3.0.3',
      info: { title: 'Projects', version: '1.0.0' },
      paths: { '/projects': { get: { responses: { 200: { description: 'OK' } } } } },
      components: { schemas: { Project: { type: 'object' } } },
      tags: [{ name: 'Projects' }],
    })
    const routes = [
      route({ path: '/projects', kind: 'openapi', filePath: '/tmp/projects.openapi.json', content: projectsSpec }),
      route({
        path: '/projects/archive',
        kind: 'openapi',
        filePath: '/tmp/projects.openapi.json',
        content: JSON.stringify({
          openapi: '3.0.3',
          info: { title: 'Projects', version: '1.0.0' },
          paths: { '/projects/archive': { get: { responses: { 200: { description: 'OK' } } } } },
          components: { schemas: { Project: { type: 'object' } } },
          tags: [{ name: 'Projects' }],
        }),
      }),
      route({
        path: '/users',
        kind: 'openapi',
        filePath: '/tmp/users.openapi.yaml',
        content: JSON.stringify({
          openapi: '3.1.0',
          info: { title: 'Users', version: '1.0.0' },
          paths: { '/users': { get: { responses: { 200: { description: 'OK' } } } } },
          components: { schemas: { User: { type: 'object' } } },
          tags: [{ name: 'Users' }],
        }),
      }),
    ]

    expect(createRootOpenAPISpec(routes, config)).toEqual({
      openapi: '3.1.0',
      info: { title: 'Platform API', description: 'All public endpoints.', version: '1.0.0' },
      paths: {
        '/projects': { get: { responses: { 200: { description: 'OK' } } } },
        '/projects/archive': { get: { responses: { 200: { description: 'OK' } } } },
        '/users': { get: { responses: { 200: { description: 'OK' } } } },
      },
      components: { schemas: { Project: { type: 'object' }, User: { type: 'object' } } },
      tags: [{ name: 'Projects' }, { name: 'Users' }],
    })
  })

  it('creates an empty root OpenAPI spec when the project has no API routes', () => {
    const config: ResolvedProjectConfig = {
      title: 'Docs',
      description: '',
      routePrefix: '',
      assetPrefix: '/',
      theme: resolveThemeConfig(),
      variables: {},
      features: resolveFeaturesConfig(),
    }

    expect(createRootOpenAPISpec([], config)).toEqual({
      openapi: '3.1.0',
      info: { title: 'Docs', description: '', version: '1.0.0' },
      paths: {},
    })
  })

  it('rejects conflicting OpenAPI path entries instead of overwriting them', () => {
    const config: ResolvedProjectConfig = {
      title: 'Docs',
      description: '',
      routePrefix: '',
      assetPrefix: '/',
      theme: resolveThemeConfig(),
      variables: {},
      features: resolveFeaturesConfig(),
    }
    const routes = [
      route({
        path: '/projects-a',
        kind: 'openapi',
        filePath: '/tmp/projects-a.openapi.json',
        content: JSON.stringify({
          openapi: '3.1.0',
          info: { title: 'Projects A', version: '1.0.0' },
          paths: { '/projects': { get: { responses: { 200: { description: 'OK' } } } } },
        }),
      }),
      route({
        path: '/projects-b',
        kind: 'openapi',
        filePath: '/tmp/projects-b.openapi.json',
        content: JSON.stringify({
          openapi: '3.1.0',
          info: { title: 'Projects B', version: '1.0.0' },
          paths: { '/projects': { post: { responses: { 201: { description: 'Created' } } } } },
        }),
      }),
    ]

    expect(() => createRootOpenAPISpec(routes, config)).toThrow(
      '[clarify] Cannot aggregate OpenAPI specs: conflicting paths entry "/projects" in /tmp/projects-b.openapi.json.',
    )
  })

  it('rejects conflicting component schemas instead of overwriting them', () => {
    const config: ResolvedProjectConfig = {
      title: 'Docs',
      description: '',
      routePrefix: '',
      assetPrefix: '/',
      theme: resolveThemeConfig(),
      variables: {},
      features: resolveFeaturesConfig(),
    }
    const routes = [
      route({
        path: '/projects',
        kind: 'openapi',
        filePath: '/tmp/projects.openapi.json',
        content: JSON.stringify({
          openapi: '3.1.0',
          info: { title: 'Projects', version: '1.0.0' },
          paths: {},
          components: { schemas: { Resource: { type: 'object' } } },
        }),
      }),
      route({
        path: '/users',
        kind: 'openapi',
        filePath: '/tmp/users.openapi.json',
        content: JSON.stringify({
          openapi: '3.1.0',
          info: { title: 'Users', version: '1.0.0' },
          paths: {},
          components: { schemas: { Resource: { type: 'string' } } },
        }),
      }),
    ]

    expect(() => createRootOpenAPISpec(routes, config)).toThrow(
      '[clarify] Cannot aggregate OpenAPI specs: conflicting components.schemas entry "Resource" in /tmp/users.openapi.json.',
    )
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
