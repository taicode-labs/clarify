import { describe, expect, it } from 'vitest'

import { resolveProjectConfig } from '../../core/config.js'
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
})
