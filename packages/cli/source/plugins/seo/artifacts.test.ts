import { describe, expect, it } from 'vitest'

import { resolveProjectConfig } from '../../core/config/config.js'
import type { ContentRoute } from '../../types.js'

import { createRobotsTxt, createSitemapXml } from './artifacts.js'

const routes: ContentRoute[] = [
  {
    path: '/',
    kind: 'mdx',
    meta: { title: 'Home' },
    module: { virtualModuleId: '/docs/source/index.mdx' },
    source: { filePath: '/docs/source/index.mdx' },
  },
  {
    path: '/guide',
    kind: 'mdx',
    meta: { title: 'Guide' },
    module: { virtualModuleId: '/docs/source/guide.mdx' },
    source: { filePath: '/docs/source/guide.mdx' },
  },
  {
    path: '/404',
    kind: 'mdx',
    meta: { title: 'Not found' },
    module: { virtualModuleId: '/docs/source/404.mdx' },
    source: { filePath: '/docs/source/404.mdx' },
  },
]

describe('SEO artifacts', () => {
  it('skips artifacts when siteUrl is not configured', () => {
    const config = resolveProjectConfig({})

    expect(createSitemapXml(routes, config)).toBeUndefined()
    expect(createRobotsTxt(config)).toBeUndefined()
  })

  it('creates sitemap.xml with routePrefix and excludes 404', () => {
    const config = resolveProjectConfig({ siteUrl: 'https://docs.example.com/', base: '/docs/' })

    expect(createSitemapXml(routes, config)).toContain('<loc>https://docs.example.com/docs/guide</loc>')
    expect(createSitemapXml(routes, config)).not.toContain('/404')
  })

  it('creates robots.txt with sitemap URL', () => {
    const config = resolveProjectConfig({ siteUrl: 'https://docs.example.com', base: '/docs/' })

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
        kind: 'mdx',
        meta: { title: 'Guide' },
        module: { virtualModuleId: '/docs/source/zh-CN/guide.mdx' },
        source: { filePath: '/docs/source/zh-CN/guide.mdx' },
      },
      {
        path: '/guide',
        basePath: '/guide',
        isBareAlias: true,
        kind: 'mdx',
        meta: { title: 'Guide' },
        module: { virtualModuleId: '/docs/source/zh-CN/guide.mdx' },
        source: { filePath: '/docs/source/zh-CN/guide.mdx' },
      },
      {
        path: '/en-US/guide',
        basePath: '/guide',
        locale: 'en-US',
        kind: 'mdx',
        meta: { title: 'Guide' },
        module: { virtualModuleId: '/docs/source/en-US/guide.mdx' },
        source: { filePath: '/docs/source/en-US/guide.mdx' },
      },
    ]
    const config = resolveProjectConfig({ siteUrl: 'https://docs.example.com/', base: '/docs/' })

    const sitemap = createSitemapXml(multilingualRoutes, config)!

    // Should include language-prefixed routes
    expect(sitemap).toContain('<loc>https://docs.example.com/docs/zh-CN/guide</loc>')
    expect(sitemap).toContain('<loc>https://docs.example.com/docs/en-US/guide</loc>')
    
    // Should exclude bare alias route
    expect(sitemap).not.toContain('<loc>https://docs.example.com/docs/guide</loc>')
  })
})
