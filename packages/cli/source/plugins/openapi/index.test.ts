import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it, afterEach, beforeEach } from 'vitest'

import { resolveThemeConfig } from '../../core/site/theme.js'
import type { ClarifyHookContext, ClarifyPlugin, ContentRoute, ResolvedBuildOptions, ResolvedProjectConfig } from '../../types.js'

import { createOpenAPIPlugin } from './index.js'

const projectConfig: ResolvedProjectConfig = {
  title: 'Test',
  description: 'Test docs',
  routePrefix: '/',
  assetPrefix: '/',
  theme: resolveThemeConfig({ tokens: { colors: { primary: '#000000' } } }),
  variables: {},
}

const generateOptions: ResolvedBuildOptions = {
  projectRoot: '/site',
  rootDirectory: 'source',
  outputDirectory: 'output',
  ssg: { failOnError: true },
}

function createContext(routes: ContentRoute[]): ClarifyHookContext {
  return {
    projectRoot: '/site',
    contentRoot: '/site/source',
    projectConfig,
    generateOptions,
    version: 'test',
    routes,
    navigation: [],
    plugins: [],
  }
}

/**
 * Plugin that mirrors the variables plugin's content:transform behavior for
 * the two test variables used below.
 */
const variableReplacementTestPlugin: ClarifyPlugin = {
  name: 'test:variable-replacement',
  hooks: {
    'content:transform': input => ({
      ...input,
      content: input.content
        .replaceAll('{{ product.name }}', 'Clarify')
        .replaceAll('{{ apiVersion }}', '1.0.0'),
    }),
  },
}

function createContextWithVariables(routes: ContentRoute[]): ClarifyHookContext {
  return {
    projectRoot: '/site',
    contentRoot: '/site/source',
    projectConfig: {
      ...projectConfig,
      variables: {
        product: { name: 'Clarify' },
        apiVersion: '1.0.0',
      },
    },
    generateOptions,
    version: 'test',
    routes,
    navigation: [],
    plugins: [variableReplacementTestPlugin],
  }
}

describe('createOpenAPIPlugin', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-openapi-plugin-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('discovers, enriches, and contributes OpenAPI virtual modules', async () => {
    const specPath = join(tempDir, 'api.openapi.json')
    writeFileSync(specPath, JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Plugin API', version: '1.0.0' },
      paths: {
        '/users': {
          get: {
            summary: 'List users',
            tags: ['Users'],
          },
        },
      },
    }), 'utf-8')

    const plugin = createOpenAPIPlugin()
    const discoveredInput = await plugin.hooks?.['routes:discover']?.({
      contentRoot: tempDir,
      routes: [],
    }, createContext([]))
    const routes = discoveredInput?.routes ?? []

    expect(routes).toMatchObject([{
      path: '/api',
      filePath: specPath,
      virtualModuleId: 'virtual:clarify-page/api',
      kind: 'openapi',
    }])

    const discovered = await plugin.hooks?.['routes:discovered']?.(routes, createContext(routes))

    expect(discovered?.[0].title).toBe('Plugin API')
    expect(discovered?.[0].sections).toEqual([
      { id: 'get-users', title: 'List users', badge: 'GET', level: 2, tags: ['Users'] },
    ])

    const modules = await plugin.hooks?.['modules:before']?.(new Map(), createContext(discovered ?? []))
    expect(modules?.get('virtual:clarify/openapi')).toContain('Plugin API')
    expect(modules?.get('virtual:clarify-page/api')).toContain('createOpenApiRouteComponent(routeData);')
  })

  it('keeps invalid OpenAPI routes renderable with diagnostics', async () => {
    const specPath = join(tempDir, 'broken.openapi.json')
    writeFileSync(specPath, '{ invalid json', 'utf-8')

    const routes: ContentRoute[] = [{
      path: '/broken',
      title: 'Broken',
      filePath: specPath,
      virtualModuleId: 'virtual:clarify-page/broken',
      kind: 'openapi',
      content: '{ invalid json',
    }]
    const plugin = createOpenAPIPlugin()

    const discovered = await plugin.hooks?.['routes:discovered']?.(routes, createContext(routes))

    expect(discovered?.[0].diagnostic).toMatchObject({
      kind: 'openapi',
      title: 'OpenAPI spec parse failed',
      filePath: specPath,
    })
    expect(discovered?.[0].diagnostic?.details).toContain('Error parsing')

    const modules = await plugin.hooks?.['modules:before']?.(new Map(), createContext(routes))
    expect(modules?.get('virtual:clarify-page/broken')).toContain('contentDiagnostic')
    expect(modules?.get('virtual:clarify-page/broken')).toContain('createContentDiagnosticComponent(contentDiagnostic);')
  })

  it('expands project variables before parsing OpenAPI specs', async () => {
    const specPath = join(tempDir, 'api.openapi.json')
    mkdirSync(join(tempDir, 'components'))
    writeFileSync(join(tempDir, 'components', 'project.schema.json'), JSON.stringify({
      type: 'object',
      properties: { id: { type: 'string' } },
    }), 'utf-8')
    writeFileSync(specPath, JSON.stringify({
      openapi: '3.0.0',
      info: { title: '{{ product.name }} API', version: '{{ apiVersion }}' },
      paths: {
        '/projects': {
          get: {
            summary: 'List {{ product.name }} projects',
            tags: ['Projects'],
            responses: {
              200: {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: { $ref: './components/project.schema.json' },
                  },
                },
              },
            },
          },
        },
      },
    }), 'utf-8')

    const plugin = createOpenAPIPlugin()
    const routes: ContentRoute[] = [{
      path: '/api',
      title: 'API',
      filePath: specPath,
      virtualModuleId: 'virtual:clarify-page/api',
      kind: 'openapi',
    }]

    const discovered = await plugin.hooks?.['routes:discovered']?.(routes, createContextWithVariables(routes))

    expect(discovered?.[0].title).toBe('Clarify API')
    expect(discovered?.[0].sections).toEqual([
      { id: 'get-projects', title: 'List Clarify projects', badge: 'GET', level: 2, tags: ['Projects'] },
    ])
    expect(discovered?.[0].content).toContain('"version":"1.0.0"')
    expect(discovered?.[0].content).toContain('"properties":{"id":{"type":"string"}}')
  })

  it('creates tag-filtered OpenAPI routes from navigation config', async () => {
    const specPath = join(tempDir, 'api.openapi.json')
    writeFileSync(specPath, JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Tagged API', version: '1.0.0' },
      paths: {
        '/projects': { get: { summary: 'List projects', tags: ['Projects'], responses: { 200: { description: 'OK' } } } },
        '/users': { get: { summary: 'List users', tags: ['Users'], responses: { 200: { description: 'OK' } } } },
      },
    }), 'utf-8')

    const plugin = createOpenAPIPlugin()
    const discoveredInput = await plugin.hooks?.['routes:discover']?.({
      contentRoot: tempDir,
      routes: [],
    }, createContext([]))
    const routes = discoveredInput?.routes ?? []
    const ctx = createContext(routes)
    ctx.projectConfig.tabs = [
      { tab: 'API', pages: [{ group: 'Reference', pages: [{ openapi: 'api.openapi.json', filter: { tags: ['Projects'] } }] }] },
    ]

    const discovered = await plugin.hooks?.['routes:discovered']?.(routes, ctx)
    const taggedRoute = discovered?.find(route => route.path === '/api/projects')

    expect(taggedRoute).toMatchObject({
      basePath: '/api/projects',
      virtualModuleId: 'virtual:clarify-page/api/projects',
      openapiTagFilter: ['Projects'],
    })
    expect(taggedRoute?.sections).toEqual([
      { id: 'get-projects', title: 'List projects', badge: 'GET', level: 2, tags: ['Projects'] },
    ])

    const modules = await plugin.hooks?.['modules:before']?.(new Map(), createContext(discovered ?? []))
    expect(modules?.get('virtual:clarify-page/api/projects')).toContain('"tagFilter":["Projects"]')
  })

  it('creates explicit-path tag-filtered OpenAPI routes from navigation config', async () => {
    const specPath = join(tempDir, 'api.openapi.json')
    writeFileSync(specPath, JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Tagged API', version: '1.0.0' },
      paths: {
        '/projects': { get: { summary: 'List projects', tags: ['Projects'], responses: { 200: { description: 'OK' } } } },
        '/users': { get: { summary: 'List users', tags: ['Users'], responses: { 200: { description: 'OK' } } } },
      },
    }), 'utf-8')

    const plugin = createOpenAPIPlugin()
    const discoveredInput = await plugin.hooks?.['routes:discover']?.({
      contentRoot: tempDir,
      routes: [],
    }, createContext([]))
    const routes = discoveredInput?.routes ?? []
    const ctx = createContext(routes)
    ctx.projectConfig.tabs = [
      { tab: 'API', pages: [{ group: 'Reference', pages: [{ openapi: 'api.openapi.json', path: 'reference/projects', filter: { tags: ['Projects'] } }] }] },
    ]

    const discovered = await plugin.hooks?.['routes:discovered']?.(routes, ctx)
    const taggedRoute = discovered?.find(route => route.path === '/reference/projects')

    expect(taggedRoute).toMatchObject({
      basePath: '/reference/projects',
      virtualModuleId: 'virtual:clarify-page/reference/projects',
      openapiTagFilter: ['Projects'],
    })
    expect(taggedRoute?.sections).toEqual([
      { id: 'get-projects', title: 'List projects', badge: 'GET', level: 2, tags: ['Projects'] },
    ])

    const modules = await plugin.hooks?.['modules:before']?.(new Map(), createContext(discovered ?? []))
    expect(modules?.get('virtual:clarify-page/reference/projects')).toContain('"tagFilter":["Projects"]')
  })

  it('creates explicit-path OpenAPI route aliases from navigation config', async () => {
    const specPath = join(tempDir, 'api.openapi.json')
    writeFileSync(specPath, JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'API', version: '1.0.0' },
      paths: {
        '/projects': { get: { summary: 'List projects', tags: ['Projects'], responses: { 200: { description: 'OK' } } } },
      },
    }), 'utf-8')

    const plugin = createOpenAPIPlugin()
    const discoveredInput = await plugin.hooks?.['routes:discover']?.({
      contentRoot: tempDir,
      routes: [],
    }, createContext([]))
    const routes = discoveredInput?.routes ?? []
    const ctx = createContext(routes)
    ctx.projectConfig.tabs = [
      { tab: 'API', pages: [{ group: 'Reference', pages: [{ openapi: 'api.openapi.json', path: 'reference' }] }] },
    ]

    const discovered = await plugin.hooks?.['routes:discovered']?.(routes, ctx)
    const aliasRoute = discovered?.find(route => route.path === '/reference')

    expect(aliasRoute).toMatchObject({
      basePath: '/reference',
      virtualModuleId: 'virtual:clarify-page/reference',
      openapiTagFilter: undefined,
    })
    expect(aliasRoute?.sections).toEqual([
      { id: 'get-projects', title: 'List projects', badge: 'GET', level: 2, tags: ['Projects'] },
    ])
  })
})
