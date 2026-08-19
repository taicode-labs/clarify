import { describe, expect, it, vi } from 'vitest'

import { resolveFeaturesConfig } from '../../core/config/config.js'
import { resolveThemeConfig } from '../../parsers/theme.js'
import type { ContentRoute, MarkdownContentRoute, OpenAPIContentRoute, ResolvedProjectConfig } from '../../types.js'

import { createContentArtifacts } from './provider.js'
import { resolveContentArtifactPath, resolveContentArtifactType, serveContentArtifacts } from './server.js'

import { createContentArtifactsPlugin } from './index.js'

const projectConfig: ResolvedProjectConfig = {
  title: 'Clarify',
  description: '',
  routePrefix: '/',
  assetPrefix: '/',
  theme: resolveThemeConfig(),
  variables: {},
  features: resolveFeaturesConfig(),
}

function createRoute(kind: 'markdown' | 'markdown+jsx' | 'openapi', contentArtifactUrl: string): ContentRoute {
  const common = {
    path: '/api',
    meta: { title: 'API' },
    source: { filePath: '/tmp/api.openapi.yaml' },
    artifacts: { contentArtifactUrl },
  }

  if (kind === 'openapi') {
    return { ...common, kind, module: { pageVirtualModuleId: 'virtual:clarify-page/api' } } satisfies OpenAPIContentRoute
  }

  return {
    ...common,
    kind,
    module: {
      pageVirtualModuleId: 'virtual:clarify-page/api',
      contentVirtualModuleId: 'virtual:clarify-content/api.md',
    },
  } satisfies MarkdownContentRoute
}

describe('content artifacts plugin server helpers', () => {
  it('resolves paths without a route prefix', () => {
    expect(resolveContentArtifactPath('/guide.md?raw=1', projectConfig)).toBe('/guide.md')
  })

  it('strips configured route prefix from artifact paths', () => {
    expect(resolveContentArtifactPath('/docs/guide.md', { ...projectConfig, routePrefix: '/docs' })).toBe('/guide.md')
  })

  it('preserves paths that only share the route prefix text', () => {
    expect(resolveContentArtifactPath('/docs-extra/guide.md', { ...projectConfig, routePrefix: '/docs' })).toBe('/docs-extra/guide.md')
  })

  it('uses markdown content type for mdx routes', () => {
    expect(resolveContentArtifactType(createRoute('markdown+jsx', '/guide.md'))).toBe('text/markdown; charset=utf-8')
  })

  it('uses markdown content type for plain Markdown routes', () => {
    expect(resolveContentArtifactType(createRoute('markdown', '/guide.md'))).toBe('text/markdown; charset=utf-8')
  })

  it('uses json content type for OpenAPI routes', () => {
    expect(resolveContentArtifactType(createRoute('openapi', '/api.openapi.json'))).toBe('application/json; charset=utf-8')
  })

  it('serves the aggregated root OpenAPI JSON with route prefixes', () => {
    const route = createRoute('openapi', '/api.openapi.json') as OpenAPIContentRoute
    route.source.content = JSON.stringify({
      openapi: '3.1.0',
      info: { title: 'API', version: '1.0.0' },
      paths: { '/users': { get: { responses: { 200: { description: 'OK' } } } } },
    })
    const headers = new Map<string, string>()
    let body = ''
    const response = {
      statusCode: 0,
      setHeader: (name: string, value: string) => headers.set(name, value),
      end: (value: string) => { body = value },
    }

    expect(serveContentArtifacts(
      { url: '/docs/openapi.json' } as never,
      response as never,
      { ...projectConfig, routePrefix: '/docs' },
      [route],
    )).toBe(true)
    expect(response.statusCode).toBe(200)
    expect(headers.get('Content-Type')).toBe('application/json; charset=utf-8')
    expect(JSON.parse(body).paths).toHaveProperty('/users')
  })

  it('uses one artifact collection for build output and development serving', async () => {
    const route = createRoute('openapi', '/api.openapi.json') as OpenAPIContentRoute
    route.source.content = JSON.stringify({ openapi: '3.1.0', info: { title: 'API', version: '1.0.0' }, paths: {} })
    const expectedArtifacts = createContentArtifacts([route], projectConfig)
    const plugin = createContentArtifactsPlugin()
    const buildAssets = plugin.hooks?.['build:assets']
    if (!buildAssets) throw new Error('build:assets hook is missing')

    const assets = await buildAssets({ projectConfig, routes: [route] } as never)
    expect(assets).toEqual(expectedArtifacts)
    expect(assets?.map(asset => asset.fileName)).toEqual(['api.openapi.json', 'api.openapi.yaml', 'llms.txt', 'openapi.json'])
    expect(JSON.parse(String(assets?.find(asset => asset.fileName === 'openapi.json')?.source)).openapi).toBe('3.1.0')
  })

  it('registers artifact serving after Vite internal middleware', async () => {
    const use = vi.fn()
    const plugin = createContentArtifactsPlugin()
    const configureServer = plugin.hooks?.['dev:configureServer']
    if (!configureServer) throw new Error('dev:configureServer hook is missing')

    const postHook = await configureServer({ middlewares: { use } } as never, {
      projectConfig,
      routes: [createRoute('markdown+jsx', '/guide.md')],
    } as never)

    expect(use).not.toHaveBeenCalled()
    expect(postHook).toBeTypeOf('function')
    postHook?.()
    expect(use).toHaveBeenCalledOnce()
  })
})
