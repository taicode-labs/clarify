import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { resolveThemeConfig } from '../../parsers/theme.js'
import type { ContentRoute, ResolvedProjectConfig } from '../../types.js'

import { resolveFeaturesConfig } from '../config/config.js'
import { readIndexHtml, injectSSRIntoTemplate, isNotFoundRoute, routeOutputFiles } from './ssg.js'

type RouteFixture = Partial<Omit<ContentRoute, 'meta' | 'module' | 'source'>> & {
  title?: string
  description?: string
  keywords?: string[]
  filePath?: string
  virtualModuleId?: string
}

function route(overrides: RouteFixture): ContentRoute {
  const { title, description, keywords, filePath, virtualModuleId, ...rest } = overrides
  return {
    path: '/guide',
    kind: 'mdx',
    meta: {
      title: title ?? 'Guide',
      description,
      keywords,
    },
    module: { virtualModuleId: virtualModuleId ?? 'virtual:guide' },
    source: { filePath: filePath ?? '/content/guide.mdx' },
    ...rest,
  }
}

describe('readIndexHtml', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('returns undefined when index.html does not exist', () => {
    const result = readIndexHtml(tempDir)
    expect(result).toBeUndefined()
  })

  it('reads index.html content when it exists', () => {
    const content = '<!doctype html><html><body><div id="root"></div></body></html>'
    writeFileSync(join(tempDir, 'index.html'), content, 'utf-8')
    const result = readIndexHtml(tempDir)
    expect(result).toBe(content)
  })
})

describe('injectSSRIntoTemplate', () => {
  const baseConfig: ResolvedProjectConfig = {
    title: 'Test Docs',
    description: 'A test site',
    routePrefix: '/',
    assetPrefix: '/',
    theme: resolveThemeConfig(),
    variables: {},
    features: resolveFeaturesConfig(),
  }

  const baseTemplate = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Default Title</title>
    <link rel="icon" href="/favicon.ico" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/source/main.tsx"></script>
  </body>
</html>`

  it('injects SSR content into root div', () => {
    const html = injectSSRIntoTemplate(baseTemplate, '<h1>Hello</h1>', baseConfig)
    expect(html).toContain('<div id="root"><h1>Hello</h1></div>')
  })

  it('injects html locale attributes for localized routes', () => {
    const config: ResolvedProjectConfig = {
      ...baseConfig,
      i18n: {
        defaultLocale: 'zh-CN',
        missing: 'fallback',
        locales: [
          { code: 'zh-CN', label: '简体中文' },
          { code: 'ar', label: 'العربية', dir: 'rtl' },
        ],
      },
    }
    const html = injectSSRIntoTemplate(baseTemplate, '', config, route({
      path: '/ar/guide',
      basePath: '/guide',
      locale: 'ar',
      title: 'Guide',
      filePath: '/content/ar/guide.mdx',
      virtualModuleId: 'virtual:guide',
    }))
    expect(html).toContain('<html lang="ar" dir="rtl">')
  })

  it('replaces title with resolved title', () => {
    const html = injectSSRIntoTemplate(baseTemplate, '', baseConfig)
    expect(html).toContain('<title>Test Docs</title>')
    expect(html).not.toContain('Default Title')
  })

  it('combines page title with site title', () => {
    const html = injectSSRIntoTemplate(baseTemplate, '', baseConfig, route({
      path: '/guide',
      title: 'Guide',
      filePath: '/content/guide.mdx',
      virtualModuleId: 'virtual:guide',
    }))
    expect(html).toContain('<title>Guide - Test Docs</title>')
  })

  it('injects description meta when not present', () => {
    const html = injectSSRIntoTemplate(baseTemplate, '', baseConfig)
    expect(html).toContain('<meta name="description" content="A test site" />')
  })

  it('uses page description before site description', () => {
    const html = injectSSRIntoTemplate(baseTemplate, '', baseConfig, route({
      path: '/guide',
      title: 'Guide',
      description: 'Guide description',
      filePath: '/content/guide.mdx',
      virtualModuleId: 'virtual:guide',
    }))
    expect(html).toContain('<meta name="description" content="Guide description" />')
  })

  it('does not inject description meta when description is empty', () => {
    const config = { ...baseConfig, description: '' }
    const html = injectSSRIntoTemplate(baseTemplate, '', config)
    expect(html).not.toContain('name="description"')
  })

  it('updates description meta if already present', () => {
    const template = baseTemplate.replace(
      '</head>',
      '  <meta name="description" content="Existing" />\n  </head>'
    )
    const html = injectSSRIntoTemplate(template, '', baseConfig)
    const matches = html.match(/name="description"/g)
    expect(matches).toHaveLength(1)
    expect(html).toContain('<meta name="description" content="A test site" />')
  })

  it('injects keywords meta from page keywords', () => {
    const html = injectSSRIntoTemplate(baseTemplate, '', baseConfig, route({
      path: '/guide',
      title: 'Guide',
      keywords: ['docs', 'api'],
      filePath: '/content/guide.mdx',
      virtualModuleId: 'virtual:guide',
    }))
    expect(html).toContain('<meta name="keywords" content="docs, api" />')
  })

  it('preserves user custom elements (favicon, scripts, links)', () => {
    const html = injectSSRIntoTemplate(baseTemplate, '<h1>X</h1>', baseConfig)
    expect(html).toContain('<link rel="icon" href="/favicon.ico" />')
    expect(html).toContain('<script type="module" src="/source/main.tsx"></script>')
  })

  it('escapes html in title', () => {
    const config = { ...baseConfig, title: 'Test <Docs>' }
    const html = injectSSRIntoTemplate(baseTemplate, '', config)
    expect(html).toContain('<title>Test &lt;Docs&gt;</title>')
  })

  it('escapes html in description', () => {
    const config = { ...baseConfig, description: 'A&B' }
    const html = injectSSRIntoTemplate(baseTemplate, '', config)
    expect(html).toContain('content="A&amp;B"')
  })

  it('adds data-pagefind-ignore to bare alias routes in multilingual sites', () => {
    const html = injectSSRIntoTemplate(baseTemplate, '<h1>Content</h1>', baseConfig, route({
      path: '/guide',
      basePath: '/guide',
      isBareAlias: true,
      title: 'Guide',
      filePath: '/content/guide.mdx',
      virtualModuleId: 'virtual:guide',
    }))
    expect(html).toContain('<div id="root" data-pagefind-ignore><h1>Content</h1></div>')
  })

  it('does not add data-pagefind-ignore to regular (non-bare-alias) routes', () => {
    const html = injectSSRIntoTemplate(baseTemplate, '<h1>Content</h1>', baseConfig, route({
      path: '/guide',
      title: 'Guide',
      filePath: '/content/guide.mdx',
      virtualModuleId: 'virtual:guide',
    }))
    expect(html).toContain('<div id="root"><h1>Content</h1></div>')
    expect(html).not.toContain('data-pagefind-ignore')
  })

  it('does not add data-pagefind-ignore to localized routes', () => {
    const config: ResolvedProjectConfig = {
      ...baseConfig,
      i18n: {
        defaultLocale: 'zh-CN',
        missing: 'fallback',
        locales: [
          { code: 'zh-CN', label: '简体中文' },
          { code: 'en-US', label: 'English' },
        ],
      },
    }
    const html = injectSSRIntoTemplate(baseTemplate, '<h1>Content</h1>', config, route({
      path: '/en-US/guide',
      basePath: '/guide',
      locale: 'en-US',
      title: 'Guide',
      filePath: '/content/en-US/guide.mdx',
      virtualModuleId: 'virtual:guide',
    }))
    expect(html).toContain('<div id="root"><h1>Content</h1></div>')
    expect(html).not.toContain('data-pagefind-ignore')
  })
})

describe('routeOutputFiles', () => {
  const outputDirectory = '/site/output'
  const baseRoute: ContentRoute = route({
    path: '/guide',
    title: 'Guide',
    filePath: '/content/guide.mdx',
    virtualModuleId: 'virtual:guide',
  })

  it('returns the nested index file for regular routes', () => {
    expect(routeOutputFiles(outputDirectory, baseRoute)).toEqual(['/site/output/guide/index.html'])
  })

  it('writes root 404.html for the default 404 route', () => {
    const route = { ...baseRoute, path: '/404', basePath: '/404' }
    expect(isNotFoundRoute(route)).toBe(true)
    expect(routeOutputFiles(outputDirectory, route)).toEqual([
      '/site/output/404/index.html',
      '/site/output/404.html',
    ])
  })

  it('does not overwrite root 404.html from localized non-default 404 routes', () => {
    const route = { ...baseRoute, path: '/zh-CN/404', basePath: '/404', locale: 'zh-CN' }
    expect(isNotFoundRoute(route)).toBe(true)
    expect(routeOutputFiles(outputDirectory, route)).toEqual(['/site/output/zh-CN/404/index.html'])
  })
})
