import { describe, it, expect } from 'vitest'

import { resolveThemeConfig } from '../core/theme.js'
import { createClientEntryModule, createRuntimeModule, generateConfigModule, generateRoutesModule } from '../core/virtual-modules.js'
import type { ContentRoute, ResolvedBuildOptions, ResolvedProjectConfig } from '../types.js'

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

describe('createRuntimeModule', () => {
  it('provides empty runtime extension data by default', () => {
    expect(createRuntimeModule()).toBe('export const openApis = {};\nexport const bannerComponent = undefined;\nexport const footerComponent = undefined;')
  })

  it('imports a configured banner component path', () => {
    expect(createRuntimeModule({ bannerComponentSource: 'path', imports: { bannerComponent: './source/Banner.tsx' } })).toBe('import BannerComponent from "./source/Banner.tsx";\nexport const openApis = {};\nexport const bannerComponent = BannerComponent;\nexport const footerComponent = undefined;')
  })

  it('imports a configured footer component path', () => {
    expect(createRuntimeModule({ footerComponentSource: 'path', imports: { footerComponent: './source/Footer.tsx' } })).toBe('import FooterComponent from "./source/Footer.tsx";\nexport const openApis = {};\nexport const bannerComponent = undefined;\nexport const footerComponent = FooterComponent;')
  })
})

describe('createClientEntryModule', () => {
  it('passes the theme editor flag to the renderer', () => {
    const code = createClientEntryModule({ themeEditor: true })

    expect(code).toContain("import { openApis, bannerComponent, footerComponent } from 'virtual:clarify-runtime';")
    expect(code).toContain('render({ config, routes, navigation, openApis, bannerComponent, footerComponent, themeEditor: true });')
    expect(code).not.toContain('ThemeEditor')
    expect(code).not.toContain('react-dom/client')
  })

  it('disables the theme editor by default', () => {
    const code = createClientEntryModule()

    expect(code).toContain('render({ config, routes, navigation, openApis, bannerComponent, footerComponent, themeEditor: false });')
    expect(code).not.toContain('ThemeEditor')
    expect(code).not.toContain('react-dom/client')
  })
})
