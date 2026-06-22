import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { resolveThemeConfig } from '../../core/theme.js'
import type { ContentRoute, ResolvedProjectConfig } from '../../types.js'

import { attachContentArtifactUrls, createLlmsTxt, createLlmsTxtArtifact, readRouteArtifactContent, readRouteContent, writeContentArtifactFiles } from './artifacts.js'

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

describe('content artifact helpers', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-raw-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('adds stable artifact URLs to markdown and OpenAPI routes', () => {
    const routes = [
      route({ path: '/', filePath: join(tempDir, 'index.mdx') }),
      route({ path: '/guide/start', filePath: join(tempDir, 'guide/start.mdx') }),
      route({ path: '/api', filePath: join(tempDir, 'api.openapi.json'), kind: 'openapi' }),
    ]

    attachContentArtifactUrls(routes)

    expect(routes.map(route => route.contentArtifactUrl)).toEqual([
      '/index.md',
      '/guide/start.md',
      '/api.openapi.json',
    ])
  })

  it('writes route context content to route-derived artifact files', () => {
    const docsDir = join(tempDir, 'docs')
    mkdirSync(docsDir, { recursive: true })
    const pagePath = join(docsDir, 'guide.mdx')
    writeFileSync(pagePath, '# Stale file content', 'utf-8')

    const routes = [route({ path: '/guide', filePath: pagePath, content: '# Guide' })]
    attachContentArtifactUrls(routes)
    writeContentArtifactFiles(routes, join(tempDir, 'output'))

    expect(readFileSync(join(tempDir, 'output/guide.md'), 'utf-8')).toBe('# Guide')
  })

  it('uses route-normalized markdown content for content artifact files', () => {
    const docsDir = join(tempDir, 'docs')
    mkdirSync(docsDir, { recursive: true })
    const pagePath = join(docsDir, 'guide.mdx')
    writeFileSync(pagePath, '---\ntitle: Guide\nicon: lucide:rocket\n---\n\n# Guide', 'utf-8')

    const routes = [route({ path: '/guide', filePath: pagePath, content: '# Guide' })]
    attachContentArtifactUrls(routes)
    writeContentArtifactFiles(routes, join(tempDir, 'output'))

    expect(readRouteContent(routes[0])).toBe('# Guide')
    expect(readFileSync(join(tempDir, 'output/guide.md'), 'utf-8')).toBe('# Guide')
  })

  it('writes non-ASCII markdown artifacts with a UTF-8 signature for strict viewers', () => {
    const routes = [route({ path: '/guide', filePath: join(tempDir, 'guide.mdx'), content: '# 快速开始\n\n中文内容' })]
    attachContentArtifactUrls(routes)
    writeContentArtifactFiles(routes, join(tempDir, 'output'))

    expect(readRouteContent(routes[0])).toBe('# 快速开始\n\n中文内容')
    expect(readRouteArtifactContent(routes[0])).toBe('\uFEFF# 快速开始\n\n中文内容')
    expect(readFileSync(join(tempDir, 'output/guide.md'), 'utf-8')).toBe('\uFEFF# 快速开始\n\n中文内容')
  })

  it('creates an llms.txt sitemap with markdown and OpenAPI links', () => {
    const config: ResolvedProjectConfig = {
      title: 'Docs',
      description: 'Helpful docs',
      routePrefix: '/docs',
      theme: resolveThemeConfig(),
      themeEditor: false,
    }
    const routes = [
      route({ path: '/guide', title: 'Guide', contentArtifactUrl: '/guide.md' }),
      route({ path: '/api', title: 'API', kind: 'openapi', contentArtifactUrl: '/api.openapi.json' }),
    ]

    expect(createLlmsTxt(routes, config)).toContain('- [Guide](/docs/guide.md)')
    expect(createLlmsTxt(routes, config)).toContain('- [API](/docs/api.openapi.json)')
  })

  it('creates llms.txt artifacts with a UTF-8 signature when they contain non-ASCII text', () => {
    const config: ResolvedProjectConfig = {
      title: '文档',
      description: '中文说明',
      routePrefix: '/',
      theme: resolveThemeConfig(),
      themeEditor: false,
    }
    const routes = [route({ path: '/guide', title: '快速开始', contentArtifactUrl: '/guide.md' })]

    expect(createLlmsTxtArtifact(routes, config).startsWith('\uFEFF# 文档')).toBe(true)
  })
})
