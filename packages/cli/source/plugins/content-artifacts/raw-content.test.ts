import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { ContentRoute, ResolvedProjectConfig } from '../../types.js'

import { createLlmsTxt, enrichRoutesWithRawContent, writeRawContentFiles } from './raw-content.js'

function route(overrides: Partial<ContentRoute>): ContentRoute {
  return {
    path: '/',
    title: 'Home',
    filePath: '/tmp/index.mdx',
    virtualModuleId: 'virtual:clarify-page/index',
    kind: 'mdx',
    ...overrides,
  }
}

describe('raw content helpers', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-raw-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('adds stable raw content URLs to markdown and OpenAPI routes', () => {
    const routes = [
      route({ path: '/', filePath: join(tempDir, 'index.mdx') }),
      route({ path: '/guide/start', filePath: join(tempDir, 'guide/start.mdx') }),
      route({ path: '/api', filePath: join(tempDir, 'api.openapi.json'), kind: 'openapi' }),
    ]

    enrichRoutesWithRawContent(routes)

    expect(routes.map(route => route.rawContentUrl)).toEqual([
      '/index.md',
      '/guide/start.md',
      '/api.openapi.json',
    ])
  })

  it('writes source content to route-derived files', () => {
    const docsDir = join(tempDir, 'docs')
    mkdirSync(docsDir, { recursive: true })
    const pagePath = join(docsDir, 'guide.mdx')
    writeFileSync(pagePath, '# Guide', 'utf-8')

    const routes = [route({ path: '/guide', filePath: pagePath })]
    enrichRoutesWithRawContent(routes)
    writeRawContentFiles(routes, join(tempDir, 'output'))

    expect(readFileSync(join(tempDir, 'output/guide.md'), 'utf-8')).toBe('# Guide')
  })

  it('creates an llms.txt sitemap with markdown and OpenAPI links', () => {
    const config: ResolvedProjectConfig = {
      title: 'Docs',
      description: 'Helpful docs',
      routePrefix: '/docs',
      theme: {},
    }
    const routes = [
      route({ path: '/guide', title: 'Guide', rawContentUrl: '/guide.md' }),
      route({ path: '/api', title: 'API', kind: 'openapi', rawContentUrl: '/api.openapi.json' }),
    ]

    expect(createLlmsTxt(routes, config)).toContain('- [Guide](/docs/guide.md)')
    expect(createLlmsTxt(routes, config)).toContain('- [API](/docs/api.openapi.json)')
  })
})
