import { describe, expect, it } from 'vitest'

import { resolveProjectConfig } from '../../core/config/index.js'
import type { ContentRoute } from '../../types.js'

import { createRobotsTxt, createSitemapXml } from './artifacts.js'

const routes: ContentRoute[] = [
  {
    path: '/',
    title: 'Home',
    filePath: '/docs/source/index.mdx',
    virtualModuleId: '/docs/source/index.mdx',
    kind: 'mdx',
  },
  {
    path: '/guide',
    title: 'Guide',
    filePath: '/docs/source/guide.mdx',
    virtualModuleId: '/docs/source/guide.mdx',
    kind: 'mdx',
  },
  {
    path: '/404',
    title: 'Not found',
    filePath: '/docs/source/404.mdx',
    virtualModuleId: '/docs/source/404.mdx',
    kind: 'mdx',
  },
]

describe('SEO artifacts', () => {
  it('skips artifacts when siteUrl is not configured', () => {
    const config = resolveProjectConfig({})

    expect(createSitemapXml(routes, config)).toBeUndefined()
    expect(createRobotsTxt(config)).toBeUndefined()
  })

  it('creates sitemap.xml with routePrefix and excludes 404', () => {
    const config = resolveProjectConfig({ siteUrl: 'https://docs.example.com/', routePrefix: '/docs/' })

    expect(createSitemapXml(routes, config)).toContain('<loc>https://docs.example.com/docs/guide</loc>')
    expect(createSitemapXml(routes, config)).not.toContain('/404')
  })

  it('creates robots.txt with sitemap URL', () => {
    const config = resolveProjectConfig({ siteUrl: 'https://docs.example.com', routePrefix: '/docs/' })

    expect(createRobotsTxt(config)).toBe(
      'User-agent: *\nAllow: /\nSitemap: https://docs.example.com/docs/sitemap.xml\n',
    )
  })

  it('excludes bare alias routes from sitemap.xml in multilingual sites', () => {
    const multilingualRoutes: ContentRoute[] = [
      {
        path: '/zh-CN/guide',
        basePath: '/guide',
        locale: 'zh-CN',
        title: 'Guide',
        filePath: '/docs/source/zh-CN/guide.mdx',
        virtualModuleId: '/docs/source/zh-CN/guide.mdx',
        kind: 'mdx',
      },
      {
        path: '/guide',
        basePath: '/guide',
        isBareAlias: true,
        title: 'Guide',
        filePath: '/docs/source/zh-CN/guide.mdx',
        virtualModuleId: '/docs/source/zh-CN/guide.mdx',
        kind: 'mdx',
      },
      {
        path: '/en-US/guide',
        basePath: '/guide',
        locale: 'en-US',
        title: 'Guide',
        filePath: '/docs/source/en-US/guide.mdx',
        virtualModuleId: '/docs/source/en-US/guide.mdx',
        kind: 'mdx',
      },
    ]
    const config = resolveProjectConfig({ siteUrl: 'https://docs.example.com/', routePrefix: '/docs/' })

    const sitemap = createSitemapXml(multilingualRoutes, config)!

    // Should include language-prefixed routes
    expect(sitemap).toContain('<loc>https://docs.example.com/docs/zh-CN/guide</loc>')
    expect(sitemap).toContain('<loc>https://docs.example.com/docs/en-US/guide</loc>')
    
    // Should exclude bare alias route
    expect(sitemap).not.toContain('<loc>https://docs.example.com/docs/guide</loc>')
  })
})
