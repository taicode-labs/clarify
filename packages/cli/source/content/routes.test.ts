import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { generateConfigModule, generateRoutesModule } from '../core/virtual-modules.js'
import type { ResolvedProjectConfig, ResolvedBuildOptions, MdxRoute, ClarifyPagesConfig, ClarifyPagesGroup, ResolvedClarifyI18nConfig } from '../types.js'

import { extractFrontmatter } from './frontmatter.js'
import { findMdxFiles, buildLocalizedNavigation, buildNavigation, buildNavigationFromConfig, findLocalizedContentRoutes } from './routes.js'

function mdxRoute(route: Omit<MdxRoute, 'kind'>): MdxRoute {
  return { ...route, kind: 'mdx' }
}

describe('findMdxFiles', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('returns empty array when directory does not exist', () => {
    const result = findMdxFiles(join(tempDir, 'nonexistent'))
    expect(result).toEqual([])
  })

  it('discovers flat mdx files', () => {
    writeFileSync(join(tempDir, 'index.mdx'), '# Home', 'utf-8')
    writeFileSync(join(tempDir, 'about.mdx'), '# About', 'utf-8')

    const result = findMdxFiles(tempDir)
    expect(result).toHaveLength(2)
    expect(result.map(r => r.path)).toContain('/')
    expect(result.map(r => r.path)).toContain('/about')
    expect(result.map(r => r.title)).toContain('Home')
    expect(result.map(r => r.title)).toContain('About')
  })

  it('handles nested directories', () => {
    const guideDir = join(tempDir, 'guide')
    mkdirSync(guideDir, { recursive: true })
    writeFileSync(join(tempDir, 'index.mdx'), '# Home', 'utf-8')
    writeFileSync(join(guideDir, 'getting-started.mdx'), '# GS', 'utf-8')

    const result = findMdxFiles(tempDir)
    expect(result).toHaveLength(2)
    expect(result.map(r => r.path)).toContain('/')
    expect(result.map(r => r.path)).toContain('/guide/getting-started')
    expect(result.map(r => r.title)).toContain('Home')
    expect(result.map(r => r.title)).toContain('Getting Started')
  })

  it('maps index.mdx to root path', () => {
    writeFileSync(join(tempDir, 'index.mdx'), '# Home', 'utf-8')
    const result = findMdxFiles(tempDir)
    const indexRoute = result.find(r => r.path === '/')
    expect(indexRoute).toBeDefined()
    expect(indexRoute?.virtualModuleId).toBe('virtual:clarify-page/index')
    expect(indexRoute?.title).toBe('Home')
  })

  it('discovers markdown and ignores unrelated files', () => {
    writeFileSync(join(tempDir, 'readme.txt'), 'text', 'utf-8')
    writeFileSync(join(tempDir, 'page.md'), '# MD', 'utf-8')
    const result = findMdxFiles(tempDir)
    expect(result).toHaveLength(1)
    expect(result[0].path).toBe('/page')
    expect(result[0].title).toBe('Page')
  })

  it('generates correct virtualModuleId', () => {
    const subDir = join(tempDir, 'api', 'auth')
    mkdirSync(subDir, { recursive: true })
    writeFileSync(join(subDir, 'login.mdx'), '# Login', 'utf-8')

    const result = findMdxFiles(tempDir)
    expect(result).toHaveLength(1)
    expect(result[0].virtualModuleId).toBe('virtual:clarify-page/api/auth/login')
  })

  it('extracts frontmatter title', () => {
    const content = '---\ntitle: My Page\n---\n\n# Hello'
    writeFileSync(join(tempDir, 'page.mdx'), content, 'utf-8')
    const result = findMdxFiles(tempDir)
    expect(result[0].title).toBe('My Page')
  })

  it('falls back to filename stem for title', () => {
    writeFileSync(join(tempDir, 'quick-start.mdx'), '# Hello', 'utf-8')
    const result = findMdxFiles(tempDir)
    expect(result[0].title).toBe('Quick Start')
  })
})

describe('generateConfigModule', () => {
  it('generates a valid ES module export', () => {
    const projectConfig: ResolvedProjectConfig = {
      title: 'Test',
      description: 'Desc',
      routePrefix: '/',
      theme: { primary: '#fff' },
    }
    const generateOptions: ResolvedBuildOptions = {
      rootDirectory: 'source/content',
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

  it('generates imports and routes array', () => {
    const routes: MdxRoute[] = [
      { path: '/', title: 'Home', filePath: '/a/index.mdx', virtualModuleId: 'virtual:clarify-page/index', kind: 'mdx' },
      { path: '/about', title: 'About', filePath: '/a/about.mdx', virtualModuleId: 'virtual:clarify-page/about', kind: 'mdx' },
    ]
    const code = generateRoutesModule(routes)
    expect(code).toContain("import Page0 from 'virtual:clarify-page/index';")
    expect(code).toContain("import Page1 from 'virtual:clarify-page/about';")
    expect(code).toContain('{ path: "/", title: "Home", component: Page0, kind: \'mdx\' }')
    expect(code).toContain('{ path: "/about", title: "About", component: Page1, kind: \'mdx\' }')
    expect(code).toContain('"title": "About"')
  })
})

describe('extractFrontmatter', () => {
  it('extracts basic frontmatter', () => {
    const content = '---\ntitle: Hello\ndescription: World\n---\n\n# Body'
    const fm = extractFrontmatter(content)
    expect(fm.title).toBe('Hello')
    expect(fm.description).toBe('World')
  })

  it('returns empty object when no frontmatter', () => {
    const fm = extractFrontmatter('# Hello')
    expect(fm).toEqual({})
  })

  it('trims quotes from values', () => {
    const content = '---\ntitle: "Quoted"\n---\n'
    const fm = extractFrontmatter(content)
    expect(fm.title).toBe('Quoted')
  })
})

describe('buildNavigation', () => {
  it('returns empty array for only home route', () => {
    const routes: MdxRoute[] = [
      mdxRoute({ path: '/', title: 'Home', filePath: 'index.mdx', virtualModuleId: 'virtual:clarify-page/index' }),
    ]
    expect(buildNavigation(routes)).toEqual([])
  })

  it('builds flat navigation', () => {
    const routes: MdxRoute[] = [
      mdxRoute({ path: '/', title: 'Home', filePath: 'index.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/guide', title: 'Guide', filePath: 'guide.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/config', title: 'Config', filePath: 'config.mdx', virtualModuleId: 'v' }),
    ]
    const tree = buildNavigation(routes)
    expect(tree).toHaveLength(2)
    expect(tree.map(n => n.path)).toEqual(['/guide', '/config'])
    expect(tree[0].title).toBe('Guide')
  })

  it('builds nested navigation', () => {
    const routes: MdxRoute[] = [
      mdxRoute({ path: '/guide/getting-started', title: 'Getting Started', filePath: 'a.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/guide/advanced', title: 'Advanced', filePath: 'b.mdx', virtualModuleId: 'v' }),
    ]
    const tree = buildNavigation(routes)
    expect(tree).toHaveLength(1)
    expect(tree[0].path).toBe('/guide')
    expect(tree[0].title).toBe('Guide')
    expect(tree[0].children).toHaveLength(2)
    expect(tree[0].children?.map(c => c.path)).toEqual(['/guide/getting-started', '/guide/advanced'])
  })
})

describe('findLocalizedContentRoutes', () => {
  let tempDir: string
  const i18n: ResolvedClarifyI18nConfig = {
    sourceLocale: 'zh-CN',
    defaultLocale: 'zh-CN',
    strategy: 'prefix_except_default',
    missing: 'fallback',
    locales: [
      { code: 'zh-CN', label: '简体中文' },
      { code: 'en-US', label: 'English' },
    ],
  }

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('discovers source/content/{locale} routes with locale-aware paths', () => {
    mkdirSync(join(tempDir, 'zh-CN'), { recursive: true })
    mkdirSync(join(tempDir, 'en-US'), { recursive: true })
    writeFileSync(join(tempDir, 'zh-CN', 'index.mdx'), '# 首页', 'utf-8')
    writeFileSync(join(tempDir, 'zh-CN', 'guide.mdx'), '# 指南', 'utf-8')
    writeFileSync(join(tempDir, 'en-US', 'index.mdx'), '# Home', 'utf-8')
    writeFileSync(join(tempDir, 'en-US', 'guide.mdx'), '# Guide', 'utf-8')

    const result = findLocalizedContentRoutes(tempDir, i18n)
    expect(result.map(route => route.path)).toEqual(expect.arrayContaining(['/', '/guide', '/en-US', '/en-US/guide']))
    expect(result.find(route => route.path === '/en-US/guide')).toMatchObject({
      basePath: '/guide',
      locale: 'en-US',
      sourceLocale: 'zh-CN',
    })
    expect(result.find(route => route.path === '/guide')?.alternates).toEqual({
      'zh-CN': '/guide',
      'en-US': '/en-US/guide',
    })
  })

  it('creates fallback routes from source locale when translation is missing', () => {
    mkdirSync(join(tempDir, 'zh-CN'), { recursive: true })
    writeFileSync(join(tempDir, 'zh-CN', 'guide.mdx'), '# 指南', 'utf-8')

    const result = findLocalizedContentRoutes(tempDir, i18n)
    expect(result.find(route => route.path === '/en-US/guide')).toMatchObject({
      basePath: '/guide',
      locale: 'en-US',
      isFallback: true,
      title: 'Guide',
    })
  })
})

describe('buildLocalizedNavigation', () => {
  const i18n: ResolvedClarifyI18nConfig = {
    sourceLocale: 'zh-CN',
    defaultLocale: 'zh-CN',
    strategy: 'prefix_except_default',
    missing: 'fallback',
    locales: [
      { code: 'zh-CN', label: '简体中文' },
      { code: 'en-US', label: 'English' },
    ],
  }

  it('builds localized navigation from one manual pages config', () => {
    const routes: MdxRoute[] = [
      mdxRoute({ path: '/', basePath: '/', locale: 'zh-CN', sourceLocale: 'zh-CN', title: '首页', filePath: 'zh-CN/index.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/guide', basePath: '/guide', locale: 'zh-CN', sourceLocale: 'zh-CN', title: '指南', filePath: 'zh-CN/guide.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/en-US', basePath: '/', locale: 'en-US', sourceLocale: 'zh-CN', title: 'Home', filePath: 'en-US/index.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/en-US/guide', basePath: '/guide', locale: 'en-US', sourceLocale: 'zh-CN', title: 'Guide', filePath: 'en-US/guide.mdx', virtualModuleId: 'v' }),
    ]
    const pages: ClarifyPagesGroup[] = [
      { group: { 'zh-CN': '指南', 'en-US': 'Guide' }, pages: ['index', { page: 'guide', title: { 'zh-CN': '开始', 'en-US': 'Start' } }] },
    ]

    const navigation = buildLocalizedNavigation(routes, pages, i18n)
    expect(navigation?.['zh-CN']?.[0].title).toBe('指南')
    expect(navigation?.['zh-CN']?.[0].children?.map(node => node.path)).toEqual(['/', '/guide'])
    expect(navigation?.['zh-CN']?.[0].children?.[1].title).toBe('开始')
    expect(navigation?.['en-US']?.[0].title).toBe('Guide')
    expect(navigation?.['en-US']?.[0].children?.map(node => node.path)).toEqual(['/en-US', '/en-US/guide'])
    expect(navigation?.['en-US']?.[0].children?.[1].title).toBe('Start')
  })
})

describe('buildNavigationFromConfig', () => {
  it('builds navigation from explicit config', () => {
    const routes: MdxRoute[] = [
      mdxRoute({ path: '/', title: 'Home', filePath: 'index.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/quickstart', title: 'Quick Start', filePath: 'quickstart.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/advanced/ssg', title: 'SSG', filePath: 'ssg.mdx', virtualModuleId: 'v' }),
    ]
    const config: ClarifyPagesGroup[] = [
      { group: 'Getting Started', icon: 'BookOpen', pages: ['index', { page: 'quickstart', icon: 'Rocket' }] },
      { group: 'Advanced', pages: ['advanced/ssg'] },
    ]
    const tree = buildNavigationFromConfig(routes, config)
    expect(tree).toHaveLength(2)
    expect(tree[0].title).toBe('Getting Started')
    expect(tree[0].icon).toBe('BookOpen')
    expect(tree[0].children?.map(c => c.path)).toEqual(['/', '/quickstart'])
    expect(tree[0].children?.[1].icon).toBe('Rocket')
    expect(tree[1].title).toBe('Advanced')
    expect(tree[1].children?.map(c => c.path)).toEqual(['/advanced/ssg'])
  })

  it('falls back to filename title when route not found', () => {
    const routes: MdxRoute[] = []
    const config: ClarifyPagesGroup[] = [
      { group: 'Missing', pages: ['nonexistent'] },
    ]
    const tree = buildNavigationFromConfig(routes, config)
    expect(tree[0].title).toBe('Missing')
    expect(tree[0].children?.[0].title).toBe('Nonexistent')
    expect(tree[0].children?.[0].path).toBe('/nonexistent')
  })
})

describe('generateRoutesModule with navigation config', () => {
  it('uses manual navigation when config is provided', () => {
    const routes: MdxRoute[] = [
      mdxRoute({ path: '/', title: 'Home', filePath: 'index.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/about', title: 'About', filePath: 'about.mdx', virtualModuleId: 'v' }),
    ]
    const pagesConfig: ClarifyPagesConfig = [
      { group: 'Docs', pages: ['index', 'about'] },
    ]
    const code = generateRoutesModule(routes, pagesConfig)
    expect(code).toContain('"title": "Docs"')
    expect(code).toContain('"/"')
    expect(code).toContain('"/about"')
  })

  it('uses auto navigation when pages is "FileTree"', () => {
    const routes: MdxRoute[] = [
      mdxRoute({ path: '/', title: 'Home', filePath: 'index.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/guide', title: 'Guide', filePath: 'guide.mdx', virtualModuleId: 'v' }),
    ]
    const code = generateRoutesModule(routes, 'FileTree')
    expect(code).toContain('"title": "Guide"')
    expect(code).not.toContain('"title": "Docs"')
  })
})
