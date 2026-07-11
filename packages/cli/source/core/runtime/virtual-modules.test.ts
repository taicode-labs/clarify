import { describe, it, expect } from 'vitest'

import { buildNavigation, buildNavigationFromTabsConfig } from '../../parsers/routes/routes.js'
import { resolveThemeConfig } from '../../parsers/theme.js'
import type { ClarifyPlugin, ContentRoute, ResolvedBuildOptions, ResolvedProjectConfig } from '../../types.js'

import { buildVirtualModules, createClientEntryModule, createRuntimeSlotsModule, generateConfigModule, generateRoutesModule } from './virtual-modules.js'

type RouteFixture = Partial<Omit<ContentRoute, 'meta' | 'module' | 'source'>> & {
  title?: string
  description?: string
  keywords?: string[]
  sections?: ContentRoute['meta']['sections']
  filePath?: string
  virtualModuleId?: string
  sourceEditUrl?: string
}

function route(overrides: RouteFixture): ContentRoute {
  const { title, description, keywords, sections, filePath, virtualModuleId, sourceEditUrl, ...rest } = overrides
  return {
    path: '/',
    kind: 'mdx',
    meta: {
      title: title ?? 'Home',
      description,
      keywords,
      sections,
    },
    module: { virtualModuleId: virtualModuleId ?? 'virtual:clarify-page/index' },
    source: {
      filePath: filePath ?? 'index.mdx',
      sourceEditUrl,
    },
    ...rest,
  }
}

describe('generateConfigModule', () => {
  it('generates a valid ES module export', () => {
    const projectConfig: ResolvedProjectConfig = {
      title: 'Test',
      description: 'Desc',
      routePrefix: '/',
      assetPrefix: '/',
      theme: resolveThemeConfig({ tokens: { colors: { primary: '#fff' } } }),
      variables: {},
    }
    const generateOptions: ResolvedBuildOptions = {
      projectRoot: '/site',
      rootDirectory: 'source',
      outputDirectory: 'dist',
      ssg: { failOnError: true },
    }
    const code = generateConfigModule(projectConfig, generateOptions)
    const expected = { ...projectConfig, ...generateOptions }
    expect(code).toBe(`export const config = ${JSON.stringify(expected)};`)
  })
})

describe('generateRoutesModule', () => {
  it('generates empty routes for empty input', () => {
    const code = generateRoutesModule([], { kind: 'flat', nodes: [] })
    expect(code).toContain('export const routes = [')
    expect(code).toContain('export const navigation = {')
    expect(code).toContain('"kind": "flat"')
    expect(code).toContain("import { createContentDiagnosticComponent } from '@clarify-labs/renderer';")
  })

  it('generates lazy imports and routes array', () => {
    const routes: ContentRoute[] = [
      route({ path: '/', title: 'Home', filePath: '/a/index.mdx', virtualModuleId: 'virtual:clarify-page/index', sourceEditUrl: 'https://github.com/acme/docs/edit/main/index.mdx' }),
      route({ path: '/about', title: 'About', filePath: '/a/about.mdx', virtualModuleId: 'virtual:clarify-page/about' }),
    ]
    const code = generateRoutesModule(routes, { kind: 'flat', nodes: [] })
    expect(code).not.toContain('import Page')
    expect(code).toContain("import { createContentDiagnosticComponent } from '@clarify-labs/renderer';")
    expect(code).toContain('createContentDiagnosticComponent({ kind:')
    expect(code).toContain('virtual:clarify-page/index')
    expect(code).toContain('virtual:clarify-page/about')
    expect(code).toContain('This page could not be loaded')
    expect(code).toContain('lazy: true')
    expect(code).toContain('title: "About"')
    expect(code).toContain('sourceEditUrl: "https://github.com/acme/docs/edit/main/index.mdx"')
  })

  it('omits plugin-specific route fields from the runtime route manifest', () => {
    const routes: ContentRoute[] = [
      route({ path: '/api', title: 'API', filePath: '/a/api.openapi.json', virtualModuleId: 'virtual:clarify-page/api', kind: 'openapi', openapi: { tagFilter: ['Projects'] } }),
    ]
    const code = generateRoutesModule(routes, { kind: 'flat', nodes: [] })
    expect(code).toContain('kind: "openapi"')
    expect(code).not.toContain('tagFilter')
    expect(code).not.toContain('sourceSpecId')
    expect(code).not.toContain('routeSpecModuleId')
  })

  it('escapes route module specifiers', () => {
    const routes: ContentRoute[] = [
      route({ path: '/quote', title: 'Quote', filePath: '/a/quote.mdx', virtualModuleId: 'virtual:clarify-page/doc\'s/quote' }),
    ]
    const clientCode = generateRoutesModule(routes, { kind: 'flat', nodes: [] })
    const serverCode = generateRoutesModule(routes, { kind: 'flat', nodes: [] }, 'server')
    expect(clientCode).toContain('import("virtual:clarify-page/doc\'s/quote")')
    expect(serverCode).toContain('import Page0 from "virtual:clarify-page/doc\'s/quote";')
  })

  it('wraps client route imports with a fallback error module', () => {
    const routes: ContentRoute[] = [
      route({ path: '/broken', title: 'Broken', filePath: '/a/broken.mdx', virtualModuleId: 'virtual:clarify-page/broken' }),
    ]

    const code = generateRoutesModule(routes, { kind: 'flat', nodes: [] })

    expect(code).toContain(`import("virtual:clarify-page/broken")`)
    expect(code).toContain("import { createContentDiagnosticComponent } from '@clarify-labs/renderer';")
    expect(code).toContain('.catch((error) =>')
    expect(code).toContain('createContentDiagnosticComponent(')
  })

  it('uses tabbed navigation when tabs are provided', () => {
    const routes: ContentRoute[] = [
      route({ path: '/', title: 'Home', filePath: 'index.mdx', virtualModuleId: 'v' }),
      route({ path: '/about', title: 'About', filePath: 'about.mdx', virtualModuleId: 'v' }),
    ]
    const projectConfig: ResolvedProjectConfig = {
      title: 'Docs',
      description: '',
      routePrefix: '/',
      assetPrefix: '/',
      theme: resolveThemeConfig(),
      variables: {},
      tabs: [
        { tab: 'Docs', pages: [{ group: 'Guide', pages: ['index', 'about'] }] },
      ],
    }
    const code = generateRoutesModule(routes, buildNavigationFromTabsConfig(routes, projectConfig.tabs!))
    expect(code).toContain('"tabs"')
    expect(code).toContain('"title": "Docs"')
    expect(code).toContain('"/"')
    expect(code).toContain('"/about"')
  })

  it('uses auto navigation when tabs are omitted', () => {
    const routes: ContentRoute[] = [
      route({ path: '/', title: 'Home', filePath: 'index.mdx', virtualModuleId: 'v' }),
      route({ path: '/guide', title: 'Guide', filePath: 'guide.mdx', virtualModuleId: 'v' }),
    ]
    const code = generateRoutesModule(routes, { kind: 'flat', nodes: buildNavigation(routes) })
    expect(code).toContain('"title": "Guide"')
    expect(code).not.toContain('"tabs"')
  })

  it('exports isBareAlias flag for multilingual sites', () => {
    const routes: ContentRoute[] = [
      route({ path: '/zh-CN/guide', basePath: '/guide', locale: 'zh-CN', title: 'Guide', filePath: '/a/guide.mdx', virtualModuleId: 'virtual:clarify-page/guide' }),
      route({ path: '/guide', basePath: '/guide', isBareAlias: true, title: 'Guide', filePath: '/a/guide.mdx', virtualModuleId: 'virtual:clarify-page/guide' }),
      route({ path: '/en-US/guide', basePath: '/guide', locale: 'en-US', title: 'Guide', filePath: '/a/guide.mdx', virtualModuleId: 'virtual:clarify-page/guide' }),
    ]
    const code = generateRoutesModule(routes, { kind: 'flat', nodes: [] })
    
    // The localized route should not have isBareAlias
    expect(code).toContain('createContentDiagnosticComponent({ kind:')
    expect(code).toContain('virtual:clarify-page/guide')
    expect(code).toContain('basePath: "/guide"')
    expect(code).toContain('locale: "zh-CN"')
    expect(code).toContain('isBareAlias: true')
    expect(code).toContain('locale: "en-US"')
  })
})

describe('buildVirtualModules', () => {
  it('emits a diagnostic route module for MDX compile failures', () => {
    const modules = buildVirtualModules({
      projectConfig: {
        title: 'Docs',
        description: 'Docs',
        routePrefix: '/',
        assetPrefix: '/',
        theme: resolveThemeConfig(),
        variables: {},
      },
      generateOptions: {
        projectRoot: '/site',
        rootDirectory: 'source',
        outputDirectory: 'dist',
        ssg: { failOnError: true },
      },
      routes: [route({
        path: '/broken',
        title: 'Broken',
        filePath: '/site/source/broken.mdx',
        virtualModuleId: 'virtual:clarify-page/broken',
        diagnostic: {
          kind: 'mdx',
          title: 'MDX syntax error',
          message: 'This page could not be compiled.',
          filePath: '/site/source/broken.mdx',
          details: 'Unexpected end of file',
        },
      })],
      navigation: { kind: 'flat', nodes: [] },
    })

    const moduleContent = modules.get('virtual:clarify-page/broken')
    expect(moduleContent).toContain('contentDiagnostic')
    expect(moduleContent).toContain('"kind":"mdx"')
    expect(moduleContent).toContain('Unexpected end of file')
    expect(moduleContent).not.toContain('createElement')
  })
})

describe('createClientEntryModule', () => {
  it('passes the theme editor flag to the renderer', () => {
    const code = createClientEntryModule({ themeEditor: true })

    expect(code).toContain("import { runtimeSlots } from 'virtual:clarify/slots';")
    expect(code).toContain("import { openApiSpecs } from 'virtual:clarify/openapi';")
    expect(code).toContain('const renderOptions = { config, routes, navigation, openApiSpecs, runtimeSlots, themeEditor: true };')
    expect(code).toContain("import.meta.hot.accept('virtual:clarify/routes'")
    expect(code).not.toContain('ThemeEditor')
    expect(code).not.toContain('react-dom/client')
  })

  it('disables the theme editor by default', () => {
    const code = createClientEntryModule()

    expect(code).toContain('const renderOptions = { config, routes, navigation, openApiSpecs, runtimeSlots, themeEditor: false };')
    expect(code).not.toContain('ThemeEditor')
    expect(code).not.toContain('react-dom/client')
  })
})

describe('createRuntimeSlotsModule', () => {
  it('exports an empty registry when no plugin declares slots', () => {
    expect(createRuntimeSlotsModule([])).toBe('export const runtimeSlots = {};\n')
    expect(createRuntimeSlotsModule([{ name: 'p', hooks: {} }])).toBe('export const runtimeSlots = {};\n')
  })

  it('stores component import factories and groups entries by slot name', () => {
    const plugins: ClarifyPlugin[] = [
      {
        name: 'clarify:github-comments',
        hooks: {},
        slots: [
          { name: 'page.footer.before', component: '/source/github-comments.tsx' },
        ],
      },
    ]

    const code = createRuntimeSlotsModule(plugins, '/project')

    expect(code).not.toContain('import ')
    expect(code).toContain('"page.footer.before": [')
    expect(code).toContain('plugin: "clarify:github-comments"')
    expect(code).toContain('loadComponent: () => import("/project/source/github-comments.tsx")')
  })

  it('resolves /-prefixed paths against the project root', () => {
    const plugins: ClarifyPlugin[] = [
      {
        name: 'a',
        hooks: {},
        slots: [{ name: 'page.footer.before', component: '/source/my-component.tsx' }],
      },
    ]

    const code = createRuntimeSlotsModule(plugins, '/project')

    expect(code).not.toContain('import ')
    expect(code).toContain('loadComponent: () => import("/project/source/my-component.tsx")')
  })

  it('stores each /-prefixed component path independently', () => {
    const plugins: ClarifyPlugin[] = [
      {
        name: 'a',
        hooks: {},
        slots: [{ name: 'page.footer.before', component: '/some-pkg/Footer' }],
      },
      {
        name: 'b',
        hooks: {},
        slots: [{ name: 'page.footer.before', component: '/some-pkg/Footer' }],
      },
    ]

    const code = createRuntimeSlotsModule(plugins, '/project')

    expect(code).not.toContain('import ')
    expect(code.match(/import\("\/project\/some-pkg\/Footer"\)/g)?.length).toBe(2)
  })

  it('throws for component paths that do not start with /', () => {
    const plugins: ClarifyPlugin[] = [
      {
        name: 'bad-plugin',
        hooks: {},
        slots: [{ name: 'page.footer.before', component: 'relative/path.tsx' }],
      },
    ]

    expect(() => createRuntimeSlotsModule(plugins, '/project')).toThrow(
      'invalid component path',
    )
  })
})
