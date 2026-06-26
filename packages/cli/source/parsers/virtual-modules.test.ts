import { describe, it, expect } from 'vitest'

import { resolveThemeConfig } from '../core/theme.js'
import { createClientEntryModule, createRuntimeSlotsModule, generateConfigModule, generateRoutesModule } from '../core/virtual-modules.js'
import type { ClarifyPlugin, ContentRoute, ResolvedBuildOptions, ResolvedProjectConfig } from '../types.js'

describe('generateConfigModule', () => {
  it('generates a valid ES module export', () => {
    const projectConfig: ResolvedProjectConfig = {
      title: 'Test',
      description: 'Desc',
      routePrefix: '/',
      theme: resolveThemeConfig({ tokens: { colors: { primary: '#fff' } } }),
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
    const code = generateRoutesModule([])
    expect(code).toContain('export const routes = [')
    expect(code).toContain('export const navigation = []')
    expect(code).not.toContain('import')
  })

  it('generates lazy imports and routes array', () => {
    const routes: ContentRoute[] = [
      { path: '/', title: 'Home', filePath: '/a/index.mdx', virtualModuleId: 'virtual:clarify-page/index', kind: 'mdx', sourceUrl: 'https://github.com/acme/docs/edit/main/index.mdx' },
      { path: '/about', title: 'About', filePath: '/a/about.mdx', virtualModuleId: 'virtual:clarify-page/about', kind: 'mdx' },
    ]
    const code = generateRoutesModule(routes)
    expect(code).not.toContain('import Page')
    expect(code).toContain('{ path: "/", title: "Home", component: () => import("virtual:clarify-page/index"), lazy: true, kind: "mdx", sourceUrl: "https://github.com/acme/docs/edit/main/index.mdx" }')
    expect(code).toContain('{ path: "/about", title: "About", component: () => import("virtual:clarify-page/about"), lazy: true, kind: "mdx" }')
    expect(code).toContain('"title": "About"')
  })

  it('omits plugin-specific route fields from the runtime route manifest', () => {
    const routes: ContentRoute[] = [
      { path: '/api', title: 'API', filePath: '/a/api.openapi.json', virtualModuleId: 'virtual:clarify-page/api', kind: 'openapi', openapiTagFilter: ['Projects'] },
    ]
    const code = generateRoutesModule(routes)
    expect(code).not.toContain('openapiTagFilter')
  })

  it('escapes route module specifiers', () => {
    const routes: ContentRoute[] = [
      { path: '/quote', title: 'Quote', filePath: '/a/quote.mdx', virtualModuleId: 'virtual:clarify-page/doc\'s/quote', kind: 'mdx' },
    ]
    const clientCode = generateRoutesModule(routes)
    const serverCode = generateRoutesModule(routes, undefined, undefined, 'server')
    expect(clientCode).toContain('import("virtual:clarify-page/doc\'s/quote")')
    expect(serverCode).toContain('import Page0 from "virtual:clarify-page/doc\'s/quote";')
  })

  it('uses tabbed navigation when tabs are provided', () => {
    const routes: ContentRoute[] = [
      { path: '/', title: 'Home', filePath: 'index.mdx', virtualModuleId: 'v', kind: 'mdx' },
      { path: '/about', title: 'About', filePath: 'about.mdx', virtualModuleId: 'v', kind: 'mdx' },
    ]
    const projectConfig: ResolvedProjectConfig = {
      title: 'Docs',
      description: '',
      routePrefix: '/',
      theme: resolveThemeConfig(),
      tabs: [
        { tab: 'Docs', pages: [{ group: 'Guide', pages: ['index', 'about'] }] },
      ],
    }
    const code = generateRoutesModule(routes, undefined, projectConfig)
    expect(code).toContain('"tabs"')
    expect(code).toContain('"title": "Docs"')
    expect(code).toContain('"/"')
    expect(code).toContain('"/about"')
  })

  it('uses auto navigation when tabs are omitted', () => {
    const routes: ContentRoute[] = [
      { path: '/', title: 'Home', filePath: 'index.mdx', virtualModuleId: 'v', kind: 'mdx' },
      { path: '/guide', title: 'Guide', filePath: 'guide.mdx', virtualModuleId: 'v', kind: 'mdx' },
    ]
    const code = generateRoutesModule(routes)
    expect(code).toContain('"title": "Guide"')
    expect(code).not.toContain('"tabs"')
  })
})

describe('createClientEntryModule', () => {
  it('passes the theme editor flag to the renderer', () => {
    const code = createClientEntryModule({ themeEditor: true })

    expect(code).toContain("import { runtimeSlots } from 'virtual:clarify/slots';")
    expect(code).toContain('render({ config, routes, navigation, openApis, runtimeSlots, themeEditor: true });')
    expect(code).not.toContain('ThemeEditor')
    expect(code).not.toContain('react-dom/client')
  })

  it('disables the theme editor by default', () => {
    const code = createClientEntryModule()

    expect(code).toContain('render({ config, routes, navigation, openApis, runtimeSlots, themeEditor: false });')
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
          { name: 'page.footer.before', component: 'virtual:clarify-github-comments-slot' },
        ],
      },
    ]

    const code = createRuntimeSlotsModule(plugins)

    expect(code).not.toContain('import ')
    expect(code).toContain('"page.footer.before": [')
    expect(code).toContain('plugin: "clarify:github-comments"')
    expect(code).toContain('component: () => import("virtual:clarify-github-comments-slot")')
  })

  it('resolves relative component paths against the project root', () => {
    const plugins: ClarifyPlugin[] = [
      {
        name: 'a',
        hooks: {},
        slots: [{ name: 'page.footer.before', component: './my-component.tsx' }],
      },
    ]

    const code = createRuntimeSlotsModule(plugins, '/project')

    expect(code).not.toContain('import ')
    expect(code).toContain('component: () => import("/project/my-component.tsx")')
  })

  it('stores each non-relative component path independently', () => {
    const plugins: ClarifyPlugin[] = [
      {
        name: 'a',
        hooks: {},
        slots: [{ name: 'page.footer.before', component: 'some-pkg/Footer' }],
      },
      {
        name: 'b',
        hooks: {},
        slots: [{ name: 'page.footer.before', component: 'some-pkg/Footer' }],
      },
    ]

    const code = createRuntimeSlotsModule(plugins)

    expect(code).not.toContain('import ')
    expect(code.match(/import\("some-pkg\/Footer"\)/g)?.length).toBe(2)
  })
})
