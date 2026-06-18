import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { generateConfigModule, generateRoutesModule } from '../core/virtual-modules.js'
import type { ResolvedProjectConfig, ResolvedBuildOptions, ContentRoute, ClarifyPagesGroup, ResolvedClarifyI18nConfig } from '../types.js'

import { extractFrontmatter } from './frontmatter.js'
import { findContentRoutes, buildLocalizedNavigation, buildLocalizedNavigationFromTabsConfig, buildNavigation, buildNavigationFromConfig, buildNavigationFromTabsConfig, findLocalizedContentRoutes } from './routes.js'

function mdxRoute(route: Omit<ContentRoute, 'kind'>): ContentRoute {
  return { ...route, kind: 'mdx' }
}

describe('findContentRoutes', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('returns empty array when directory does not exist', () => {
    const result = findContentRoutes(join(tempDir, 'nonexistent'))
    expect(result).toEqual([])
  })

  it('discovers flat mdx files', () => {
    writeFileSync(join(tempDir, 'index.mdx'), '# Home', 'utf-8')
    writeFileSync(join(tempDir, 'about.mdx'), '# About', 'utf-8')

    const result = findContentRoutes(tempDir)
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

    const result = findContentRoutes(tempDir)
    expect(result).toHaveLength(2)
    expect(result.map(r => r.path)).toContain('/')
    expect(result.map(r => r.path)).toContain('/guide/getting-started')
    expect(result.map(r => r.title)).toContain('Home')
    expect(result.map(r => r.title)).toContain('Getting Started')
  })

  it('maps index.mdx to root path', () => {
    writeFileSync(join(tempDir, 'index.mdx'), '# Home', 'utf-8')
    const result = findContentRoutes(tempDir)
    const indexRoute = result.find(r => r.path === '/')
    expect(indexRoute).toBeDefined()
    expect(indexRoute?.virtualModuleId).toBe('virtual:clarify-page/index')
    expect(indexRoute?.title).toBe('Home')
  })

  it('discovers markdown and ignores unrelated files', () => {
    writeFileSync(join(tempDir, 'readme.txt'), 'text', 'utf-8')
    writeFileSync(join(tempDir, 'page.md'), '# MD', 'utf-8')
    const result = findContentRoutes(tempDir)
    expect(result).toHaveLength(1)
    expect(result[0].path).toBe('/page')
    expect(result[0].title).toBe('Page')
  })

  it('generates correct virtualModuleId', () => {
    const subDir = join(tempDir, 'api', 'auth')
    mkdirSync(subDir, { recursive: true })
    writeFileSync(join(subDir, 'login.mdx'), '# Login', 'utf-8')

    const result = findContentRoutes(tempDir)
    expect(result).toHaveLength(1)
    expect(result[0].virtualModuleId).toBe('virtual:clarify-page/api/auth/login')
  })

  it('extracts frontmatter title', () => {
    const content = '---\ntitle: My Page\n---\n\n# Hello'
    writeFileSync(join(tempDir, 'page.mdx'), content, 'utf-8')
    const result = findContentRoutes(tempDir)
    expect(result[0].title).toBe('My Page')
  })

  it('ignores frontmatter when extracting sections', () => {
    const content = [
      '---',
      'title: 入门概览',
      'description: 用最短路径完成准备。',
      'icon: lucide:rocket',
      '---',
      '',
      '# 入门概览',
      '## 首次验证',
    ].join('\n')
    writeFileSync(join(tempDir, 'overview.mdx'), content, 'utf-8')

    const result = findContentRoutes(tempDir)

    expect(result[0].title).toBe('入门概览')
    expect(result[0].frontmatter).toEqual({
      title: '入门概览',
      description: '用最短路径完成准备。',
      icon: 'lucide:rocket',
    })
    expect(result[0].content).toBe('# 入门概览\n## 首次验证')
    expect(result[0].sections).toEqual([{ id: '首次验证', title: '首次验证', level: 2 }])
  })

  it('falls back to filename stem for title', () => {
    writeFileSync(join(tempDir, 'quick-start.mdx'), '# Hello', 'utf-8')
    const result = findContentRoutes(tempDir)
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

  it('generates imports and routes array', () => {
    const routes: ContentRoute[] = [
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
    const routes: ContentRoute[] = [
      mdxRoute({ path: '/', title: 'Home', filePath: 'index.mdx', virtualModuleId: 'virtual:clarify-page/index' }),
    ]
    expect(buildNavigation(routes)).toEqual([])
  })

  it('builds flat navigation', () => {
    const routes: ContentRoute[] = [
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
    const routes: ContentRoute[] = [
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
    defaultLocale: 'zh-CN',
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

  it('discovers source/{locale} routes with locale-aware paths', () => {
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
    })
    expect(result.find(route => route.path === '/guide')?.alternates).toEqual({
      'zh-CN': '/guide',
      'en-US': '/en-US/guide',
    })
  })

  it('creates fallback routes from default locale when translation is missing', () => {
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

  it('omits missing translation alternates when fallback is disabled', () => {
    mkdirSync(join(tempDir, 'zh-CN'), { recursive: true })
    mkdirSync(join(tempDir, 'en-US'), { recursive: true })
    writeFileSync(join(tempDir, 'zh-CN', 'guide.mdx'), '# 指南', 'utf-8')
    writeFileSync(join(tempDir, 'en-US', 'index.mdx'), '# Home', 'utf-8')

    const result = findLocalizedContentRoutes(tempDir, { ...i18n, missing: 'hide' })
    expect(result.find(route => route.path === '/guide')?.alternates).toEqual({
      'zh-CN': '/guide',
    })
  })
})

describe('buildLocalizedNavigation', () => {
  const i18n: ResolvedClarifyI18nConfig = {
    defaultLocale: 'zh-CN',
    missing: 'fallback',
    locales: [
      { code: 'zh-CN', label: '简体中文' },
      { code: 'en-US', label: 'English' },
    ],
  }

  it('builds localized navigation from one manual pages config', () => {
    const routes: ContentRoute[] = [
      mdxRoute({ path: '/', basePath: '/', locale: 'zh-CN', title: '首页', filePath: 'zh-CN/index.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/guide', basePath: '/guide', locale: 'zh-CN', title: '指南', filePath: 'zh-CN/guide.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/en-US', basePath: '/', locale: 'en-US', title: 'Home', filePath: 'en-US/index.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/en-US/guide', basePath: '/guide', locale: 'en-US', title: 'Guide', filePath: 'en-US/guide.mdx', virtualModuleId: 'v' }),
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

describe('buildNavigationFromTabsConfig', () => {
  const i18n: ResolvedClarifyI18nConfig = {
    defaultLocale: 'zh-CN',
    missing: 'fallback',
    locales: [
      { code: 'zh-CN', label: '简体中文' },
      { code: 'en-US', label: 'English' },
    ],
  }

  it('builds tabbed navigation from per-tab pages config', () => {
    const routes: ContentRoute[] = [
      mdxRoute({ path: '/', title: 'Home', filePath: 'index.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/guide', title: 'Guide', filePath: 'guide.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/api', title: 'API', filePath: 'api.mdx', virtualModuleId: 'v' }),
    ]

    const navigation = buildNavigationFromTabsConfig(routes, [
      { tab: 'Docs', icon: 'BookOpen', pages: [{ group: 'Guide', pages: ['guide'] }] },
      { tab: 'API', pages: [{ group: 'Reference', pages: ['api'] }] },
    ])

    expect(navigation.tabs).toHaveLength(2)
    expect(navigation.tabs[0]).toMatchObject({ type: 'tab', path: '/guide', title: 'Docs', icon: 'BookOpen' })
    expect(navigation.tabs[0].children[0].children?.[0].path).toBe('/guide')
    expect(navigation.tabs[1]).toMatchObject({ type: 'tab', path: '/api', title: 'API' })
  })

  it('builds localized tabbed navigation', () => {
    const routes: ContentRoute[] = [
      mdxRoute({ path: '/guide', basePath: '/guide', locale: 'zh-CN', title: '指南', filePath: 'zh-CN/guide.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/en-US/guide', basePath: '/guide', locale: 'en-US', title: 'Guide', filePath: 'en-US/guide.mdx', virtualModuleId: 'v' }),
    ]

    const navigation = buildLocalizedNavigationFromTabsConfig(routes, [
      { tab: { 'zh-CN': '文档', 'en-US': 'Docs' }, pages: [{ group: { 'zh-CN': '指南', 'en-US': 'Guide' }, pages: ['guide'] }] },
    ], i18n)

    expect(navigation?.['zh-CN'].tabs[0].title).toBe('文档')
    expect(navigation?.['zh-CN'].tabs[0].path).toBe('/guide')
    expect(navigation?.['en-US'].tabs[0].title).toBe('Docs')
    expect(navigation?.['en-US'].tabs[0].path).toBe('/en-US/guide')
  })
})

describe('buildNavigationFromConfig', () => {
  it('builds navigation from explicit config', () => {
    const routes: ContentRoute[] = [
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
    const routes: ContentRoute[] = []
    const config: ClarifyPagesGroup[] = [
      { group: 'Missing', pages: ['nonexistent'] },
    ]
    const tree = buildNavigationFromConfig(routes, config)
    expect(tree[0].title).toBe('Missing')
    expect(tree[0].children?.[0].title).toBe('Nonexistent')
    expect(tree[0].children?.[0].path).toBe('/nonexistent')
  })
})

describe('generateRoutesModule with tabs config', () => {
  it('uses tabbed navigation when tabs are provided', () => {
    const routes: ContentRoute[] = [
      mdxRoute({ path: '/', title: 'Home', filePath: 'index.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/about', title: 'About', filePath: 'about.mdx', virtualModuleId: 'v' }),
    ]
    const projectConfig: ResolvedProjectConfig = {
      title: 'Docs',
      description: '',
      routePrefix: '/',
      theme: {},
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
      mdxRoute({ path: '/', title: 'Home', filePath: 'index.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/guide', title: 'Guide', filePath: 'guide.mdx', virtualModuleId: 'v' }),
    ]
    const code = generateRoutesModule(routes)
    expect(code).toContain('"title": "Guide"')
    expect(code).not.toContain('"tabs"')
  })
})
