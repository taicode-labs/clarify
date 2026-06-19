import { describe, it, expect } from 'vitest'

import { resolveThemeConfig } from '../core/theme.js'
import { generateConfigModule, generateRoutesModule } from '../core/virtual-modules.js'
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
      { path: '/', title: 'Home', filePath: '/a/index.mdx', virtualModuleId: 'virtual:clarify-page/index', kind: 'mdx' },
      { path: '/about', title: 'About', filePath: '/a/about.mdx', virtualModuleId: 'virtual:clarify-page/about', kind: 'mdx' },
    ]
    const code = generateRoutesModule(routes)
    expect(code).not.toContain('import Page')
    expect(code).toContain('{ path: "/", title: "Home", component: () => import(\'virtual:clarify-page/index\'), lazy: true, kind: \'mdx\' }')
    expect(code).toContain('{ path: "/about", title: "About", component: () => import(\'virtual:clarify-page/about\'), lazy: true, kind: \'mdx\' }')
    expect(code).toContain('"title": "About"')
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
