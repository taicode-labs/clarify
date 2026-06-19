import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { findContentRoutes, findLocalizedContentRoutes } from './routes.js'
import { testI18n } from './routes.test-utils.js'

describe('findContentRoutes', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('returns empty array when directory does not exist', () => {
    const result = findContentRoutes(join(tempDir, 'nonexistent'))
    expect(result).toEqual([])
  })

  it('discovers flat mdx files', () => {
    writeFileSync(join(tempDir, 'index.mdx'), '# Home', 'utf-8')
    writeFileSync(join(tempDir, 'about.mdx'), '# About', 'utf-8')

    const result = findContentRoutes(tempDir)
    expect(result).toHaveLength(2)
    expect(result.map(r => r.path)).toContain('/')
    expect(result.map(r => r.path)).toContain('/about')
    expect(result.map(r => r.title)).toContain('Home')
    expect(result.map(r => r.title)).toContain('About')
  })

  it('handles nested directories', () => {
    const guideDir = join(tempDir, 'guide')
    mkdirSync(guideDir, { recursive: true })
    writeFileSync(join(tempDir, 'index.mdx'), '# Home', 'utf-8')
    writeFileSync(join(guideDir, 'getting-started.mdx'), '# GS', 'utf-8')

    const result = findContentRoutes(tempDir)
    expect(result).toHaveLength(2)
    expect(result.map(r => r.path)).toContain('/')
    expect(result.map(r => r.path)).toContain('/guide/getting-started')
    expect(result.map(r => r.title)).toContain('Home')
    expect(result.map(r => r.title)).toContain('Getting Started')
  })

  it('maps index.mdx to root path', () => {
    writeFileSync(join(tempDir, 'index.mdx'), '# Home', 'utf-8')
    const result = findContentRoutes(tempDir)
    const indexRoute = result.find(r => r.path === '/')
    expect(indexRoute).toBeDefined()
    expect(indexRoute?.virtualModuleId).toBe('virtual:clarify-page/index')
    expect(indexRoute?.title).toBe('Home')
  })

  it('discovers markdown and ignores unrelated files', () => {
    writeFileSync(join(tempDir, 'readme.txt'), 'text', 'utf-8')
    writeFileSync(join(tempDir, 'page.md'), '# MD', 'utf-8')
    const result = findContentRoutes(tempDir)
    expect(result).toHaveLength(1)
    expect(result[0].path).toBe('/page')
    expect(result[0].title).toBe('Page')
  })

  it('generates correct virtualModuleId', () => {
    const subDir = join(tempDir, 'api', 'auth')
    mkdirSync(subDir, { recursive: true })
    writeFileSync(join(subDir, 'login.mdx'), '# Login', 'utf-8')

    const result = findContentRoutes(tempDir)
    expect(result).toHaveLength(1)
    expect(result[0].virtualModuleId).toBe('virtual:clarify-page/api/auth/login')
  })

  it('extracts frontmatter title', () => {
    const content = '---\ntitle: My Page\n---\n\n# Hello'
    writeFileSync(join(tempDir, 'page.mdx'), content, 'utf-8')
    const result = findContentRoutes(tempDir)
    expect(result[0].title).toBe('My Page')
  })

  it('ignores frontmatter when extracting sections', () => {
    const content = [
      '---',
      'title: 入门概览',
      'description: 用最短路径完成准备。',
      'icon: lucide:rocket',
      '---',
      '',
      '# 入门概览',
      '## 首次验证',
    ].join('\n')
    writeFileSync(join(tempDir, 'overview.mdx'), content, 'utf-8')

    const result = findContentRoutes(tempDir)

    expect(result[0].title).toBe('入门概览')
    expect(result[0].frontmatter).toEqual({
      title: '入门概览',
      description: '用最短路径完成准备。',
      icon: 'lucide:rocket',
    })
    expect(result[0].content).toBe('# 入门概览\n## 首次验证')
    expect(result[0].sections).toEqual([{ id: '首次验证', title: '首次验证', level: 2 }])
  })

  it('falls back to filename stem for title', () => {
    writeFileSync(join(tempDir, 'quick-start.mdx'), '# Hello', 'utf-8')
    const result = findContentRoutes(tempDir)
    expect(result[0].title).toBe('Quick Start')
  })
})

describe('findLocalizedContentRoutes', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('discovers source/{locale} routes with locale-aware paths', () => {
    mkdirSync(join(tempDir, 'zh-CN'), { recursive: true })
    mkdirSync(join(tempDir, 'en-US'), { recursive: true })
    writeFileSync(join(tempDir, 'zh-CN', 'index.mdx'), '# 首页', 'utf-8')
    writeFileSync(join(tempDir, 'zh-CN', 'guide.mdx'), '# 指南', 'utf-8')
    writeFileSync(join(tempDir, 'en-US', 'index.mdx'), '# Home', 'utf-8')
    writeFileSync(join(tempDir, 'en-US', 'guide.mdx'), '# Guide', 'utf-8')

    const result = findLocalizedContentRoutes(tempDir, testI18n)
    expect(result.map(route => route.path)).toEqual(expect.arrayContaining(['/', '/guide', '/en-US', '/en-US/guide']))
    expect(result.find(route => route.path === '/en-US/guide')).toMatchObject({
      basePath: '/guide',
      locale: 'en-US',
    })
    expect(result.find(route => route.path === '/guide')?.alternates).toEqual({
      'zh-CN': '/guide',
      'en-US': '/en-US/guide',
    })
  })

  it('creates fallback routes from default locale when translation is missing', () => {
    mkdirSync(join(tempDir, 'zh-CN'), { recursive: true })
    writeFileSync(join(tempDir, 'zh-CN', 'guide.mdx'), '# 指南', 'utf-8')

    const result = findLocalizedContentRoutes(tempDir, testI18n)
    expect(result.find(route => route.path === '/en-US/guide')).toMatchObject({
      basePath: '/guide',
      locale: 'en-US',
      isFallback: true,
      title: 'Guide',
    })
  })

  it('omits missing translation alternates when fallback is disabled', () => {
    mkdirSync(join(tempDir, 'zh-CN'), { recursive: true })
    mkdirSync(join(tempDir, 'en-US'), { recursive: true })
    writeFileSync(join(tempDir, 'zh-CN', 'guide.mdx'), '# 指南', 'utf-8')
    writeFileSync(join(tempDir, 'en-US', 'index.mdx'), '# Home', 'utf-8')

    const result = findLocalizedContentRoutes(tempDir, { ...testI18n, missing: 'hide' })
    expect(result.find(route => route.path === '/guide')?.alternates).toEqual({
      'zh-CN': '/guide',
    })
  })
})
