import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { readIndexHtml, injectSSRIntoTemplate } from './ssg.js'
import type { ResolvedProjectConfig} from './types.js'

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
    theme: {},
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

  it('replaces title with resolved title', () => {
    const html = injectSSRIntoTemplate(baseTemplate, '', baseConfig)
    expect(html).toContain('<title>Test Docs</title>')
    expect(html).not.toContain('Default Title')
  })

  it('injects description meta when not present', () => {
    const html = injectSSRIntoTemplate(baseTemplate, '', baseConfig)
    expect(html).toContain('<meta name="description" content="A test site" />')
  })

  it('does not inject description meta when description is empty', () => {
    const config = { ...baseConfig, description: '' }
    const html = injectSSRIntoTemplate(baseTemplate, '', config)
    expect(html).not.toContain('name="description"')
  })

  it('does not duplicate description meta if already present', () => {
    const template = baseTemplate.replace(
      '</head>',
      '  <meta name="description" content="Existing" />\n  </head>'
    )
    const html = injectSSRIntoTemplate(template, '', baseConfig)
    const matches = html.match(/name="description"/g)
    expect(matches).toHaveLength(1)
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
