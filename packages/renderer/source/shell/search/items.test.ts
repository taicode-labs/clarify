import { describe, it, expect } from 'vitest'

import type { NavigationNode, RouteItem } from '../../core/types'

import { buildSearchItems } from './items'

describe('buildSearchItems', () => {
  it('builds search items from routes and navigation', () => {
    const routes: RouteItem[] = [
      {
        path: '/guide',
        title: 'Guide',
        component: () => Promise.resolve({ default: () => null }),
        kind: 'mdx',
      },
      {
        path: '/reference',
        title: 'Reference',
        component: () => Promise.resolve({ default: () => null }),
        kind: 'mdx',
        sections: [
          { id: 'api', title: 'API', level: 2 },
          { id: 'config', title: 'Config', level: 2 },
        ],
      },
    ]
    const navigation: NavigationNode[] = [
      {
        path: '#',
        title: 'Docs',
        children: [
          { title: 'Guide', path: '/guide' },
          { title: 'Reference', path: '/reference' },
        ],
      },
    ]

    const items = buildSearchItems(routes, navigation)

    expect(items).toHaveLength(4)
    expect(items[0]).toMatchObject({
      title: 'Guide',
      url: '/guide',
      pageTitle: 'Guide',
      sectionTitle: 'Docs',
    })
    expect(items[1]).toMatchObject({
      title: 'Reference',
      url: '/reference',
      pageTitle: 'Reference',
      sectionTitle: 'Docs',
    })
    expect(items[2]).toMatchObject({
      title: 'API',
      url: '/reference#api',
      pageTitle: 'Reference',
    })
    expect(items[3]).toMatchObject({
      title: 'Config',
      url: '/reference#config',
      pageTitle: 'Reference',
    })
  })

  it('skips bare alias routes from search items in multilingual sites', () => {
    const routes: RouteItem[] = [
      {
        path: '/zh-CN/guide',
        basePath: '/guide',
        locale: 'zh-CN',
        title: 'Guide',
        component: () => Promise.resolve({ default: () => null }),
        kind: 'mdx',
      },
      {
        path: '/guide',
        basePath: '/guide',
        isBareAlias: true,
        title: 'Guide',
        component: () => Promise.resolve({ default: () => null }),
        kind: 'mdx',
      },
      {
        path: '/en-US/guide',
        basePath: '/guide',
        locale: 'en-US',
        title: 'Guide',
        component: () => Promise.resolve({ default: () => null }),
        kind: 'mdx',
      },
    ]
    const navigation: NavigationNode[] = [
      {
        path: '#',
        title: 'Docs',
        children: [
          { title: 'Guide', path: '/guide' },
        ],
      },
    ]

    const items = buildSearchItems(routes, navigation)

    // Should only have 2 items (zh-CN and en-US), not the bare alias
    expect(items).toHaveLength(2)
    expect(items.map(item => item.url)).toEqual(['/zh-CN/guide', '/en-US/guide'])
  })

  it('handles routes without sections correctly', () => {
    const routes: RouteItem[] = [
      {
        path: '/about',
        title: 'About',
        component: () => Promise.resolve({ default: () => null }),
        kind: 'mdx',
      },
    ]
    const navigation: NavigationNode[] = []

    const items = buildSearchItems(routes, navigation)

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      title: 'About',
      url: '/about',
      pageTitle: 'About',
      sectionTitle: undefined,
    })
  })

  it('generates keywords for search matching', () => {
    const routes: RouteItem[] = [
      {
        path: '/api',
        title: 'API Reference',
        component: () => Promise.resolve({ default: () => null }),
        kind: 'openapi',
      },
    ]
    const navigation: NavigationNode[] = []

    const items = buildSearchItems(routes, navigation)

    expect(items[0].keywords).toContain('api reference')
    expect(items[0].keywords).toContain('openapi')
  })

  it('includes section titles in keywords for searchability', () => {
    const routes: RouteItem[] = [
      {
        path: '/docs',
        title: 'Documentation',
        component: () => Promise.resolve({ default: () => null }),
        kind: 'mdx',
        sections: [
          { id: 'intro', title: 'Introduction', level: 2 },
        ],
      },
    ]
    const navigation: NavigationNode[] = [
      {
        path: '#',
        title: 'Main',
        children: [{ title: 'Documentation', path: '/docs' }],
      },
    ]

    const items = buildSearchItems(routes, navigation)

    // First item is the page, second is the section
    expect(items[1].keywords).toContain('introduction')
  })

  it('handles multiple sections correctly', () => {
    const routes: RouteItem[] = [
      {
        path: '/guide',
        title: 'Getting Started',
        component: () => Promise.resolve({ default: () => null }),
        kind: 'mdx',
        sections: [
          { id: 'setup', title: 'Setup', level: 2 },
          { id: 'install', title: 'Installation', level: 2 },
          { id: 'config', title: 'Configuration', level: 2 },
        ],
      },
    ]
    const navigation: NavigationNode[] = []

    const items = buildSearchItems(routes, navigation)

    expect(items).toHaveLength(4) // 1 page + 3 sections
    expect(items.map(item => item.url)).toEqual([
      '/guide',
      '/guide#setup',
      '/guide#install',
      '/guide#config',
    ])
  })
})
