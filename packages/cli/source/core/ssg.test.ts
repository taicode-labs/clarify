import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import type { ResolvedProjectConfig } from '../types.js'

import { readIndexHtml, injectSSRIntoTemplate, SSR_BUNDLE_EXTERNALS } from './ssg.js'
import { resolveThemeConfig } from './theme.js'

describe('SSR_BUNDLE_EXTERNALS', () => {
  it('keeps react runtime dependencies external to prevent duplicate React instances', () => {
    const externals = SSR_BUNDLE_EXTERNALS
      .filter((pattern): pattern is RegExp => pattern instanceof RegExp)
      .map(pattern => pattern.source)

    expect(externals).toContain('^react(?:\\/.*)?$')
    expect(externals).toContain('^react-dom(?:\\/.*)?$')
    expect(externals).toContain('^react-router-dom(?:\\/.*)?$')
    expect(externals).toContain('^@clarify-labs\\/renderer(?:\\/.*)?$')
  })
})

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
    theme: resolveThemeConfig(),
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
    const html = injectSSRIntoTemplate(baseTemplate, '', config, {
      path: '/ar/guide',
      basePath: '/guide',
      locale: 'ar',
      title: 'Guide',
      filePath: '/content/ar/guide.mdx',
      kind: 'mdx',
      virtualModuleId: 'virtual:guide',
    })
    expect(html).toContain('<html lang="ar" dir="rtl">')
  })

  it('replaces title with resolved title', () => {
    const html = injectSSRIntoTemplate(baseTemplate, '', baseConfig)
    expect(html).toContain('<title>Test Docs</title>')
    expect(html).not.toContain('Default Title')
  })

  it('combines page title with site title', () => {
    const html = injectSSRIntoTemplate(baseTemplate, '', baseConfig, {
      path: '/guide',
      title: 'Guide',
      filePath: '/content/guide.mdx',
      kind: 'mdx',
      virtualModuleId: 'virtual:guide',
    })
    expect(html).toContain('<title>Guide - Test Docs</title>')
  })

  it('injects description meta when not present', () => {
    const html = injectSSRIntoTemplate(baseTemplate, '', baseConfig)
    expect(html).toContain('<meta name="description" content="A test site" />')
  })

  it('uses page description before site description', () => {
    const html = injectSSRIntoTemplate(baseTemplate, '', baseConfig, {
      path: '/guide',
      title: 'Guide',
      description: 'Guide description',
      filePath: '/content/guide.mdx',
      kind: 'mdx',
      virtualModuleId: 'virtual:guide',
    })
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
    const html = injectSSRIntoTemplate(baseTemplate, '', baseConfig, {
      path: '/guide',
      title: 'Guide',
      keywords: ['docs', 'api'],
      filePath: '/content/guide.mdx',
      kind: 'mdx',
      virtualModuleId: 'virtual:guide',
    })
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
})
