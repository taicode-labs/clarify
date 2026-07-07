import { describe, it, expect } from 'vitest'

import type { ClarifyPagesGroup, ContentRoute } from '../../types.js'

import { applyConfiguredPageRoutePaths, buildLocalizedNavigation, buildLocalizedNavigationFromTabsConfig, buildNavigation, buildNavigationFromConfig, buildNavigationFromTabsConfig } from './index.js'
import { mdxRoute, testI18n } from './routes.test-utils.js'

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

describe('buildLocalizedNavigation', () => {
  it('builds localized navigation from one manual pages config', () => {
    const routes: ContentRoute[] = [
      mdxRoute({ path: '/zh-CN', basePath: '/', locale: 'zh-CN', title: '首页', filePath: 'zh-CN/index.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/zh-CN/guide', basePath: '/guide', locale: 'zh-CN', title: '指南', filePath: 'zh-CN/guide.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/en-US', basePath: '/', locale: 'en-US', title: 'Home', filePath: 'en-US/index.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/en-US/guide', basePath: '/guide', locale: 'en-US', title: 'Guide', filePath: 'en-US/guide.mdx', virtualModuleId: 'v' }),
    ]
    const pages: ClarifyPagesGroup[] = [
      { group: { 'zh-CN': '指南', 'en-US': 'Guide' }, pages: ['index', { page: 'guide', title: { 'zh-CN': '开始', 'en-US': 'Start' } }] },
    ]

    const navigation = buildLocalizedNavigation(routes, pages, testI18n)
    expect(navigation?.['zh-CN']?.[0].title).toBe('指南')
    expect(navigation?.['zh-CN']?.[0].children?.map(node => node.path)).toEqual(['/zh-CN', '/zh-CN/guide'])
    expect(navigation?.['zh-CN']?.[0].children?.[1].title).toBe('开始')
    expect(navigation?.['en-US']?.[0].title).toBe('Guide')
    expect(navigation?.['en-US']?.[0].children?.map(node => node.path)).toEqual(['/en-US', '/en-US/guide'])
    expect(navigation?.['en-US']?.[0].children?.[1].title).toBe('Start')
  })
})

describe('buildNavigationFromTabsConfig', () => {
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
      mdxRoute({ path: '/zh-CN/guide', basePath: '/guide', locale: 'zh-CN', title: '指南', filePath: 'zh-CN/guide.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/en-US/guide', basePath: '/guide', locale: 'en-US', title: 'Guide', filePath: 'en-US/guide.mdx', virtualModuleId: 'v' }),
    ]

    const navigation = buildLocalizedNavigationFromTabsConfig(routes, [
      { tab: { 'zh-CN': '文档', 'en-US': 'Docs' }, pages: [{ group: { 'zh-CN': '指南', 'en-US': 'Guide' }, pages: ['guide'] }] },
    ], testI18n)

    expect(navigation?.['zh-CN'].tabs[0].title).toBe('文档')
    expect(navigation?.['zh-CN'].tabs[0].path).toBe('/zh-CN/guide')
    expect(navigation?.['en-US'].tabs[0].title).toBe('Docs')
    expect(navigation?.['en-US'].tabs[0].path).toBe('/en-US/guide')
  })

  it('builds localized tabbed navigation with explicit page paths', () => {
    const routes: ContentRoute[] = [
      mdxRoute({ path: '/zh-CN/docs/start', basePath: '/docs/start', locale: 'zh-CN', title: '指南', filePath: 'zh-CN/guide.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/en-US/docs/start', basePath: '/docs/start', locale: 'en-US', title: 'Guide', filePath: 'en-US/guide.mdx', virtualModuleId: 'v' }),
    ]

    const navigation = buildLocalizedNavigationFromTabsConfig(routes, [
      { tab: { 'zh-CN': '文档', 'en-US': 'Docs' }, pages: [{ group: { 'zh-CN': '指南', 'en-US': 'Guide' }, pages: [{ page: 'guide', path: 'docs/start' }] }] },
    ], testI18n)

    expect(navigation?.['zh-CN'].tabs[0].path).toBe('/zh-CN/docs/start')
    expect(navigation?.['zh-CN'].tabs[0].children[0].children?.[0].path).toBe('/zh-CN/docs/start')
    expect(navigation?.['en-US'].tabs[0].path).toBe('/en-US/docs/start')
    expect(navigation?.['en-US'].tabs[0].children[0].children?.[0].path).toBe('/en-US/docs/start')
  })
})

describe('applyConfiguredPageRoutePaths', () => {
  it('adds explicit page path route aliases', () => {
    const routes: ContentRoute[] = [
      mdxRoute({ path: '/guide', basePath: '/guide', title: 'Guide', filePath: 'guide.mdx', virtualModuleId: 'virtual:clarify-page/guide' }),
    ]

    const nextRoutes = applyConfiguredPageRoutePaths(routes, [
      { tab: 'Docs', pages: [{ group: 'Guide', pages: [{ page: 'guide', path: 'docs/start' }] }] },
    ])

    expect(nextRoutes.find(route => route.path === '/docs/start')).toMatchObject({
      basePath: '/docs/start',
      filePath: 'guide.mdx',
      virtualModuleId: 'virtual:clarify-page/guide',
    })
  })

  it('adds localized explicit page path route aliases', () => {
    const routes: ContentRoute[] = [
      mdxRoute({ path: '/zh-CN/guide', basePath: '/guide', locale: 'zh-CN', title: '指南', filePath: 'zh-CN/guide.mdx', virtualModuleId: 'v' }),
      mdxRoute({ path: '/en-US/guide', basePath: '/guide', locale: 'en-US', title: 'Guide', filePath: 'en-US/guide.mdx', virtualModuleId: 'v' }),
    ]

    const nextRoutes = applyConfiguredPageRoutePaths(routes, [
      { tab: 'Docs', pages: [{ group: 'Guide', pages: [{ page: 'guide', path: 'docs/start' }] }] },
    ], testI18n)

    expect(nextRoutes.find(route => route.locale === 'zh-CN' && route.basePath === '/docs/start')?.path).toBe('/zh-CN/docs/start')
    expect(nextRoutes.find(route => route.locale === 'en-US' && route.basePath === '/docs/start')?.path).toBe('/en-US/docs/start')
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

  it('uses explicit page paths in navigation', () => {
    const routes: ContentRoute[] = [
      mdxRoute({
        path: '/docs/start',
        basePath: '/docs/start',
        title: 'Getting Started',
        filePath: 'guide.mdx',
        virtualModuleId: 'virtual:clarify-page/guide',
        document: { id: '/docs/start', title: 'Getting Started', source: 'guide.mdx', content: [], metadata: { sections: [{ id: 'intro', title: 'Intro', level: 2 }] } },
      }),
    ]
    const config: ClarifyPagesGroup[] = [
      { group: 'Guide', pages: [{ page: 'guide', path: 'docs/start' }] },
    ]

    const tree = buildNavigationFromConfig(routes, config)
    expect(tree[0].children?.[0]).toMatchObject({
      path: '/docs/start',
      title: 'Getting Started',
      sections: [{ id: 'intro', title: 'Intro' }],
    })
  })

  it('uses explicit OpenAPI paths in navigation', () => {
    const routes: ContentRoute[] = [
      {
        path: '/reference/projects',
        basePath: '/reference/projects',
        title: 'Tagged API',
        filePath: 'api.openapi.json',
        virtualModuleId: 'virtual:clarify-page/reference/projects',
        kind: 'openapi',
        document: { id: '/reference/projects', title: 'Tagged API', source: 'api.openapi.json', content: [], metadata: { sections: [{ id: 'get-projects', title: 'List projects', level: 2, badge: 'GET', tags: ['Projects'] }] } },
      },
    ]
    const config: ClarifyPagesGroup[] = [
      { group: 'API', pages: [{ openapi: 'api.openapi.json', path: 'reference/projects', filter: { tags: ['Projects'] } }] },
    ]

    const tree = buildNavigationFromConfig(routes, config)
    expect(tree[0].children?.[0]).toMatchObject({
      path: '/reference/projects',
      title: 'Tagged API',
      sections: [{ id: 'get-projects', title: 'List projects', badge: 'GET', tags: ['Projects'] }],
    })
  })

  it('builds OpenAPI navigation paths from tag filters', () => {
    const routes: ContentRoute[] = [
      {
        path: '/api/projects',
        basePath: '/api/projects',
        title: 'API',
        filePath: 'api.openapi.json',
        virtualModuleId: 'virtual:clarify-page/api/projects',
        kind: 'openapi',
        document: { id: '/api/projects', title: 'API', source: 'api.openapi.json', content: [], metadata: { sections: [{ id: 'get-projects', title: 'List projects', level: 2, badge: 'GET', tags: ['Projects'] }] } },
      },
    ]
    const config: ClarifyPagesGroup[] = [
      { group: 'API', pages: [{ openapi: 'api.openapi.json', title: 'Projects API', filter: { tags: ['Projects'] } }] },
    ]
    const tree = buildNavigationFromConfig(routes, config)
    expect(tree[0].children?.[0]).toMatchObject({
      path: '/api/projects',
      title: 'Projects API',
      sections: [{ id: 'get-projects', title: 'List projects', badge: 'GET', tags: ['Projects'] }],
    })
  })
})
