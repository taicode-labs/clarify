import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it, afterEach, beforeEach } from 'vitest'

import { resolveFeaturesConfig } from '../../core/config/config.js'
import { resolveThemeConfig } from '../../parsers/theme.js'
import type { ClarifyHookContext, ClarifyPlugin, ContentRoute, OpenAPIContentRoute, ResolvedBuildOptions, ResolvedProjectConfig } from '../../types.js'

import { createOpenAPIPlugin } from './index.js'

const sectionIdExtension = 'x-clarify-section-id'

const projectConfig: ResolvedProjectConfig = {
  title: 'Test',
  description: 'Test docs',
  routePrefix: '/',
  assetPrefix: '/',
  theme: resolveThemeConfig({ tokens: { colors: { primary: '#000000' } } }),
  variables: {},
  features: resolveFeaturesConfig(),
}

const generateOptions: ResolvedBuildOptions = {
  projectRoot: '/site',
  rootDirectory: 'source',
  outputDirectory: 'output',
}

function createContext(routes: ContentRoute[], projectRoot: string = '/site'): ClarifyHookContext {
  return {
    projectRoot,
    contentRoot: join(projectRoot, 'source'),
    projectConfig: { ...projectConfig },
    generateOptions: { ...generateOptions, projectRoot },
    version: 'test',
    routes,
    navigation: { kind: 'flat', nodes: [] },
    plugins: [],
    get: () => undefined,
    set: () => undefined,
    has: () => false,
    delete: () => false,
  }
}

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
    navigation: { kind: 'flat', nodes: [] },
    plugins: [variableReplacementTestPlugin],
    get: () => undefined,
    set: () => undefined,
    has: () => false,
    delete: () => false,
  }
}

type RouteFixture = Partial<Omit<OpenAPIContentRoute, 'kind' | 'meta' | 'module' | 'source'>> & {
  title?: string
  sections?: ContentRoute['meta']['sections']
  filePath?: string
  pageVirtualModuleId?: string
  content?: string
}

function route(overrides: RouteFixture): OpenAPIContentRoute {
  const { title, sections, filePath, pageVirtualModuleId, content, ...rest } = overrides
  return {
    path: '/api',
    kind: 'openapi',
    meta: {
      title: title ?? 'API',
      sections,
    },
    module: { pageVirtualModuleId: pageVirtualModuleId ?? 'virtual:clarify-page/api' },
    source: {
      filePath: filePath ?? '/site/source/api.openapi.json',
      content,
    },
    ...rest,
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
            operationId: ' listUsers ',
            summary: 'List users',
            tags: ['Users'],
          },
        },
        '/users/{id}': {
          patch: {
            summary: 'Update user',
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
      source: { filePath: specPath },
      module: { pageVirtualModuleId: 'virtual:clarify-page/api' },
      kind: 'openapi',
    }])

    const discovered = await plugin.hooks?.['routes:discovered']?.(routes, createContext(routes, tempDir))

    expect(discovered?.[0].meta.title).toBe('Plugin API')
    expect(discovered?.[0].meta.sections).toEqual([
      { id: 'listUsers', title: 'List users', badge: 'GET', level: 2, tags: ['Users'] },
      { id: 'patch-usersid', title: 'Update user', badge: 'PATCH', level: 2, tags: ['Users'] },
    ])

    const modules = await plugin.hooks?.['modules:before']?.(new Map(), createContext(discovered ?? [], tempDir))
    const clientRegistry = modules?.get('virtual:clarify/openapi')
    expect(clientRegistry).toContain('() => import("virtual:clarify/openapi-spec/')
    expect(clientRegistry).not.toContain('Plugin API')
    expect(modules?.get('virtual:clarify/openapi/server')).toContain('Plugin API')
    const specModule = [...modules!.entries()].find(([key]) => key.startsWith('virtual:clarify/openapi-spec/'))?.[1]
    expect(specModule).toContain(`"${sectionIdExtension}":"listUsers"`)
    expect(specModule).toContain(`"${sectionIdExtension}":"patch-usersid"`)
    expect(modules?.get('virtual:clarify-page/api')).toContain('import spec from "virtual:clarify/openapi-spec/')
    expect(modules?.get('virtual:clarify-page/api')).toContain('createOpenApiRouteComponent({ ...routeData, spec });')
    expect(modules?.get('virtual:clarify-page/api')).not.toContain('"specPath"')
    expect(modules?.get('virtual:clarify-page/api')).not.toContain('Plugin API')
  })

  it('keeps invalid OpenAPI routes renderable with diagnostics', async () => {
    const specPath = join(tempDir, 'broken.openapi.json')
    writeFileSync(specPath, '{ invalid json', 'utf-8')

    const routes: ContentRoute[] = [route({
      path: '/broken',
      title: 'Broken',
      filePath: specPath,
      pageVirtualModuleId: 'virtual:clarify-page/broken',
      content: '{ invalid json',
    })]
    const plugin = createOpenAPIPlugin()

    const discovered = await plugin.hooks?.['routes:discovered']?.(routes, createContext(routes, tempDir))

    expect(discovered?.[0].diagnostic).toMatchObject({
      kind: 'openapi', title: 'OpenAPI spec parse failed',
      filePath: 'broken.openapi.json',
      message: 'Clarify could not parse this OpenAPI specification.',
    })
    expect(discovered?.[0].diagnostic?.details).toContain('Error parsing')

    const modules = await plugin.hooks?.['modules:before']?.(new Map(), createContext(discovered ?? [], tempDir))
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
    const routes: ContentRoute[] = [route({
      path: '/api',
      title: 'API',
      filePath: specPath,
      pageVirtualModuleId: 'virtual:clarify-page/api',
    })]

    const discovered = await plugin.hooks?.['routes:discovered']?.(routes, createContextWithVariables(routes))

    expect(discovered?.[0].meta.title).toBe('Clarify API')
    expect(discovered?.[0].meta.sections).toEqual([
      { id: 'get-projects', title: 'List Clarify projects', badge: 'GET', level: 2, tags: ['Projects'] },
    ])
    expect(discovered?.[0].source.content).toContain('"version":"1.0.0"')
    expect(discovered?.[0].source.content).toContain('"properties":{"id":{"type":"string"}}')
  })

  it('creates tag-filtered OpenAPI routes from nested navigation config', async () => {
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
    ctx.projectConfig.navigation = { tabs: [
      { tab: 'API', pages: [{ group: 'Reference', pages: [{ group: 'Resources', pages: [{ openapi: 'api.openapi.json', filter: { tags: ['Projects'] } }] }] }] },
    ] }

    const discovered = await plugin.hooks?.['routes:discovered']?.(routes, ctx)
    const taggedRoute = discovered?.find(route => route.path === '/api/projects')

    expect(taggedRoute).toMatchObject({
      basePath: '/api/projects',
      module: { pageVirtualModuleId: 'virtual:clarify-page/api/projects' },
      openapi: { tagFilter: ['Projects'] },
    })
    expect(taggedRoute?.meta.sections).toEqual([
      { id: 'get-projects', title: 'List projects', badge: 'GET', level: 2, tags: ['Projects'] },
    ])

    const modules = await plugin.hooks?.['modules:before']?.(new Map(), createContext(discovered ?? []))
    const routeModule = modules?.get('virtual:clarify-page/api/projects') ?? ''
    const specModuleId = routeModule.match(/import spec from "([^"]+)"/)?.[1]
    expect(specModuleId).toContain('_tags_Projects')
    expect(modules?.get(specModuleId!)).toContain('List projects')
    expect(modules?.get(specModuleId!)).not.toContain('List users')
  })

  it('keeps sections and content isolated across OpenAPI route aliases', async () => {
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
    ctx.projectConfig.navigation = { tabs: [
      {
        tab: 'API',
        pages: [{
          group: 'Reference',
          pages: [
            { openapi: 'api.openapi.json', path: 'api/projects', filter: { tags: ['Projects'] } },
            { openapi: 'api.openapi.json', path: 'api/users', filter: { tags: ['Users'] } },
          ],
        }],
      },
    ] }

    const discovered = await plugin.hooks?.['routes:discovered']?.(routes, ctx)
    const fullRoute = discovered?.find(route => route.path === '/api')
    const projectsRoute = discovered?.find(route => route.path === '/api/projects')
    const usersRoute = discovered?.find(route => route.path === '/api/users')

    expect(fullRoute?.meta.sections?.map(section => section.title)).toEqual(['List projects', 'List users'])
    expect(projectsRoute?.meta.sections?.map(section => section.title)).toEqual(['List projects'])
    expect(usersRoute?.meta.sections?.map(section => section.title)).toEqual(['List users'])
    expect(JSON.parse(fullRoute?.source.content ?? '{}').paths).toHaveProperty('/projects')
    expect(JSON.parse(fullRoute?.source.content ?? '{}').paths).toHaveProperty('/users')
    expect(JSON.parse(projectsRoute?.source.content ?? '{}').paths).toHaveProperty('/projects')
    expect(JSON.parse(projectsRoute?.source.content ?? '{}').paths).not.toHaveProperty('/users')
    expect(JSON.parse(usersRoute?.source.content ?? '{}').paths).toHaveProperty('/users')
    expect(JSON.parse(usersRoute?.source.content ?? '{}').paths).not.toHaveProperty('/projects')
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
    ctx.projectConfig.navigation = { tabs: [
      { tab: 'API', pages: [{ group: 'Reference', pages: [{ openapi: 'api.openapi.json', path: 'reference/projects', filter: { tags: ['Projects'] } }] }] },
    ] }

    const discovered = await plugin.hooks?.['routes:discovered']?.(routes, ctx)
    const taggedRoute = discovered?.find(route => route.path === '/reference/projects')

    expect(taggedRoute).toMatchObject({
      basePath: '/reference/projects',
      module: { pageVirtualModuleId: 'virtual:clarify-page/reference/projects' },
      openapi: { tagFilter: ['Projects'] },
    })
    expect(taggedRoute?.meta.sections).toEqual([
      { id: 'get-projects', title: 'List projects', badge: 'GET', level: 2, tags: ['Projects'] },
    ])

    const modules = await plugin.hooks?.['modules:before']?.(new Map(), createContext(discovered ?? []))
    const routeModule = modules?.get('virtual:clarify-page/reference/projects') ?? ''
    const specModuleId = routeModule.match(/import spec from "([^"]+)"/)?.[1]
    expect(specModuleId).toContain('_tags_Projects')
    expect(routeModule).not.toContain('"tagFilter"')
    expect(modules?.get(specModuleId!)).toContain('List projects')
    expect(modules?.get(specModuleId!)).not.toContain('List users')
  })

  it('creates localized explicit-path OpenAPI routes with locale-specific module ids', async () => {
    const specPath = join(tempDir, 'api.openapi.json')
    writeFileSync(specPath, JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Tagged API', version: '1.0.0' },
      paths: {
        '/projects': { get: { summary: 'List projects', tags: ['Projects'], responses: { 200: { description: 'OK' } } } },
      },
    }), 'utf-8')

    const plugin = createOpenAPIPlugin()
    const routes: ContentRoute[] = [
      route({ path: '/api', basePath: '/api', locale: 'zh-CN', title: 'API', filePath: specPath, pageVirtualModuleId: 'virtual:clarify-page/zh-CN/api' }),
      route({ path: '/en-US/api', basePath: '/api', locale: 'en-US', title: 'API', filePath: specPath, pageVirtualModuleId: 'virtual:clarify-page/en-US/api' }),
    ]
    const ctx = createContext(routes)
    ctx.projectConfig.locales = {
      default: 'zh-CN',
      missing: 'fallback',
      locales: [
        { code: 'zh-CN', label: '简体中文', dir: 'ltr' },
        { code: 'en-US', label: 'English', dir: 'ltr' },
      ],
    }
    ctx.projectConfig.navigation = { tabs: [
      { tab: 'API', pages: [{ group: 'Reference', pages: [{ openapi: 'api.openapi.json', path: 'openapi/pages', filter: { tags: ['Projects'] } }] }] },
    ] }

    const discovered = await plugin.hooks?.['routes:discovered']?.(routes, ctx)

    expect(discovered?.find(route => route.path === '/zh-CN/openapi/pages')).toMatchObject({
      basePath: '/openapi/pages',
      locale: 'zh-CN',
      module: { pageVirtualModuleId: 'virtual:clarify-page/zh-CN/openapi/pages' },
      openapi: { tagFilter: ['Projects'] },
    })
    expect(discovered?.find(route => route.path === '/openapi/pages')).toMatchObject({
      basePath: '/openapi/pages',
      module: { pageVirtualModuleId: 'virtual:clarify-page/openapi/pages' },
      isBareAlias: true,
      openapi: { tagFilter: ['Projects'] },
    })
    expect(discovered?.find(route => route.path === '/en-US/openapi/pages')).toMatchObject({
      basePath: '/openapi/pages',
      locale: 'en-US',
      module: { pageVirtualModuleId: 'virtual:clarify-page/en-US/openapi/pages' },
      openapi: { tagFilter: ['Projects'] },
    })

    const modules = await plugin.hooks?.['modules:before']?.(new Map(), createContext(discovered ?? []))
    const clientRegistry = modules?.get('virtual:clarify/openapi')
    expect(clientRegistry).toContain('"virtual:clarify-page/zh-CN/openapi/pages"')
    expect(clientRegistry).toContain('"virtual:clarify-page/openapi/pages"')
    expect(clientRegistry).toContain('"virtual:clarify-page/en-US/openapi/pages"')
    expect(modules?.get('virtual:clarify-page/openapi/pages')).toContain('import spec from "virtual:clarify/openapi-spec/')
    expect(modules?.get('virtual:clarify-page/zh-CN/openapi/pages')).toContain('import spec from "virtual:clarify/openapi-spec/')
    expect(modules?.get('virtual:clarify-page/en-US/openapi/pages')).toContain('import spec from "virtual:clarify/openapi-spec/')
  })

  it('creates configured OpenAPI routes for locale-scoped spec files', async () => {
    const zhSpecPath = join(tempDir, 'zh-CN', 'api.openapi.json')
    const enSpecPath = join(tempDir, 'en-US', 'api.openapi.json')
    mkdirSync(join(tempDir, 'zh-CN'), { recursive: true })
    mkdirSync(join(tempDir, 'en-US'), { recursive: true })
    const spec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'API', version: '1.0.0' },
      paths: {
        '/pages': { get: { summary: 'List pages', tags: ['Pages'], responses: { 200: { description: 'OK' } } } },
      },
    })
    writeFileSync(zhSpecPath, spec, 'utf-8')
    writeFileSync(enSpecPath, spec, 'utf-8')

    const plugin = createOpenAPIPlugin()
    const routes: ContentRoute[] = [
      route({ path: '/api', basePath: '/api', locale: 'zh-CN', title: 'API', filePath: zhSpecPath, pageVirtualModuleId: 'virtual:clarify-page/zh-CN/api' }),
      route({ path: '/en-US/api', basePath: '/api', locale: 'en-US', title: 'API', filePath: enSpecPath, pageVirtualModuleId: 'virtual:clarify-page/en-US/api' }),
    ]
    const ctx = createContext(routes)
    ctx.contentRoot = tempDir
    ctx.projectConfig.locales = {
      default: 'zh-CN',
      missing: 'fallback',
      locales: [
        { code: 'zh-CN', label: '简体中文', dir: 'ltr' },
        { code: 'en-US', label: 'English', dir: 'ltr' },
      ],
    }
    ctx.projectConfig.navigation = { tabs: [
      { tab: 'API', pages: [{ group: 'Reference', pages: [{ openapi: 'api.openapi.json', path: 'openapi/pages', filter: { tags: ['Pages'] } }] }] },
    ] }

    const discovered = await plugin.hooks?.['routes:discovered']?.(routes, ctx)

    expect(discovered?.find(route => route.path === '/openapi/pages')).toMatchObject({
      basePath: '/openapi/pages',
      module: { pageVirtualModuleId: 'virtual:clarify-page/openapi/pages' },
      isBareAlias: true,
      openapi: { tagFilter: ['Pages'] },
    })
    expect(discovered?.find(route => route.path === '/en-US/openapi/pages')).toMatchObject({
      basePath: '/openapi/pages',
      module: { pageVirtualModuleId: 'virtual:clarify-page/en-US/openapi/pages' },
      openapi: { tagFilter: ['Pages'] },
    })
  })

  it('discovers OpenAPI routes with i18n route metadata', async () => {
    const zhSpecPath = join(tempDir, 'zh-CN', 'api.openapi.json')
    const enSpecPath = join(tempDir, 'en-US', 'api.openapi.json')
    mkdirSync(join(tempDir, 'zh-CN'), { recursive: true })
    mkdirSync(join(tempDir, 'en-US'), { recursive: true })
    writeFileSync(zhSpecPath, '{"openapi":"3.0.0","info":{"title":"API","version":"1.0.0"},"paths":{}}', 'utf-8')
    writeFileSync(enSpecPath, '{"openapi":"3.0.0","info":{"title":"API","version":"1.0.0"},"paths":{}}', 'utf-8')

    const plugin = createOpenAPIPlugin()
    const ctx = createContext([])
    ctx.projectConfig.locales = {
      default: 'zh-CN',
      missing: 'fallback',
      locales: [
        { code: 'zh-CN', label: '简体中文', dir: 'ltr' },
        { code: 'en-US', label: 'English', dir: 'ltr' },
      ],
    }
    const result = await plugin.hooks?.['routes:discover']?.({ contentRoot: tempDir, routes: [] }, ctx)
    const discovered = result?.routes

    expect(discovered?.find(route => route.path === '/zh-CN/api')).toMatchObject({
      basePath: '/api',
      locale: 'zh-CN',
      module: { pageVirtualModuleId: 'virtual:clarify-page/zh-CN/api' },
    })
    expect(discovered?.find(route => route.path === '/en-US/api')).toMatchObject({
      basePath: '/api',
      locale: 'en-US',
      module: { pageVirtualModuleId: 'virtual:clarify-page/en-US/api' },
    })
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
    ctx.projectConfig.navigation = { tabs: [
      { tab: 'API', pages: [{ group: 'Reference', pages: [{ openapi: 'api.openapi.json', path: 'reference' }] }] },
    ] }

    const aliasRoute = (await plugin.hooks?.['routes:discovered']?.(routes, ctx))?.find(route => route.path === '/reference')

    expect(aliasRoute).toMatchObject({
      basePath: '/reference',
      module: { pageVirtualModuleId: 'virtual:clarify-page/reference' },
      openapi: { tagFilter: undefined },
    })
    expect(aliasRoute?.meta.sections).toEqual([
      { id: 'get-projects', title: 'List projects', badge: 'GET', level: 2, tags: ['Projects'] },
    ])
  })
})
