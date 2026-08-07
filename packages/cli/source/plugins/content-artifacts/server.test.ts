import { describe, expect, it, vi } from 'vitest'
import { parse as yamlParse } from 'yaml'

import { resolveFeaturesConfig } from '../../core/config/config.js'
import { resolveThemeConfig } from '../../parsers/theme.js'
import type { ContentRoute, MarkdownContentRoute, OpenAPIContentRoute, ResolvedProjectConfig } from '../../types.js'

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

  it('serves the aggregated root OpenAPI artifacts', () => {
    const route = createRoute('openapi', '/api.openapi.json')
    route.source.content = JSON.stringify({
      openapi: '3.1.0',
      info: { title: 'API', version: '1.0.0' },
      paths: { '/projects': { get: { responses: { 200: { description: 'OK' } } } } },
    })
    const response = {
      setHeader: vi.fn(),
      end: vi.fn(),
    }

    expect(serveContentArtifacts({ url: '/openapi.json' } as never, response as never, projectConfig, [route])).toBe(true)
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json; charset=utf-8')
    expect(JSON.parse(response.end.mock.calls[0]![0])).toMatchObject({
      openapi: '3.1.0',
      paths: { '/projects': expect.any(Object) },
    })
  })

  it('serves the aggregated root OpenAPI artifact as parseable YAML', () => {
    const route = createRoute('openapi', '/api.openapi.json')
    route.source.content = JSON.stringify({
      openapi: '3.1.0',
      info: { title: 'API', version: '1.0.0' },
      paths: { '/users': { get: { responses: { 200: { description: 'OK' } } } } },
    })
    const response = {
      setHeader: vi.fn(),
      end: vi.fn(),
    }

    expect(serveContentArtifacts({ url: '/openapi.yml' } as never, response as never, projectConfig, [route])).toBe(true)
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'text/yaml; charset=utf-8')
    expect(yamlParse(response.end.mock.calls[0]![0])).toMatchObject({
      openapi: '3.1.0',
      paths: { '/users': expect.any(Object) },
    })
  })

  it('emits root OpenAPI JSON and YAML build assets', async () => {
    const route = createRoute('openapi', '/api.openapi.json')
    route.source.content = JSON.stringify({
      openapi: '3.1.0',
      info: { title: 'API', version: '1.0.0' },
      paths: { '/projects': {} },
    })
    const buildAssets = createContentArtifactsPlugin().hooks?.['build:assets']
    if (!buildAssets) throw new Error('build:assets hook is missing')

    const assets = await buildAssets({ routes: [route], projectConfig } as never)

    expect(assets).toEqual(expect.arrayContaining([
      expect.objectContaining({ fileName: 'openapi.json' }),
      expect.objectContaining({ fileName: 'openapi.yml' }),
    ]))
  })

  it('emits valid empty root OpenAPI assets when there are no API routes', async () => {
    const buildAssets = createContentArtifactsPlugin().hooks?.['build:assets']
    if (!buildAssets) throw new Error('build:assets hook is missing')

    const assets = await buildAssets({ routes: [], projectConfig } as never)
    const jsonAsset = assets.find(asset => asset.fileName === 'openapi.json')
    const yamlAsset = assets.find(asset => asset.fileName === 'openapi.yml')

    expect(JSON.parse(String(jsonAsset?.source))).toMatchObject({ openapi: '3.1.0', paths: {} })
    expect(yamlParse(String(yamlAsset?.source))).toMatchObject({ openapi: '3.1.0', paths: {} })
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
