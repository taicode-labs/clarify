import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createContentProcessor } from '../content/content.js'

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

  it('returns empty array when directory does not exist', async () => {
    const result = await findContentRoutes(join(tempDir, 'nonexistent'))
    expect(result).toEqual([])
  })

  it('discovers flat mdx files', async () => {
    writeFileSync(join(tempDir, 'index.mdx'), '# Home', 'utf-8')
    writeFileSync(join(tempDir, 'about.mdx'), '# About', 'utf-8')

    const result = await findContentRoutes(tempDir)
    expect(result).toHaveLength(2)
    expect(result.map(r => r.path)).toContain('/')
    expect(result.map(r => r.path)).toContain('/about')
    expect(result.map(r => r.meta.title)).toContain('Home')
    expect(result.map(r => r.meta.title)).toContain('About')
  })

  it('handles nested directories', async () => {
    const guideDir = join(tempDir, 'guide')
    mkdirSync(guideDir, { recursive: true })
    writeFileSync(join(tempDir, 'index.mdx'), '# Home', 'utf-8')
    writeFileSync(join(guideDir, 'getting-started.mdx'), '# GS', 'utf-8')

    const result = await findContentRoutes(tempDir)
    expect(result).toHaveLength(2)
    expect(result.map(r => r.path)).toContain('/')
    expect(result.map(r => r.path)).toContain('/guide/getting-started')
    expect(result.map(r => r.meta.title)).toContain('Home')
    expect(result.map(r => r.meta.title)).toContain('Getting Started')
  })

  it('maps index.mdx to root path', async () => {
    writeFileSync(join(tempDir, 'index.mdx'), '# Home', 'utf-8')
    const result = await findContentRoutes(tempDir)
    const indexRoute = result.find(r => r.path === '/')
    expect(indexRoute).toBeDefined()
    expect(indexRoute?.module.pageVirtualModuleId).toBe('virtual:clarify-page/index')
    expect(indexRoute?.meta.title).toBe('Home')
  })

  it('discovers markdown and ignores unrelated files', async () => {
    writeFileSync(join(tempDir, 'readme.txt'), 'text', 'utf-8')
    writeFileSync(join(tempDir, 'page.md'), '# MD', 'utf-8')
    const result = await findContentRoutes(tempDir)
    expect(result).toHaveLength(1)
    expect(result[0].path).toBe('/page')
    expect(result[0].meta.title).toBe('Page')
    expect(result[0].kind).toBe('markdown')
  })

  it('distinguishes Markdown from Markdown with JSX', async () => {
    writeFileSync(join(tempDir, 'plain.md'), '# Plain', 'utf-8')
    writeFileSync(join(tempDir, 'component.mdx'), '# Component', 'utf-8')

    const result = await findContentRoutes(tempDir)

    expect(result.find(route => route.path === '/plain')?.kind).toBe('markdown')
    expect(result.find(route => route.path === '/component')?.kind).toBe('markdown+jsx')
  })

  it('generates correct pageVirtualModuleId', async () => {
    const subDir = join(tempDir, 'api', 'auth')
    mkdirSync(subDir, { recursive: true })
    writeFileSync(join(subDir, 'login.mdx'), '# Login', 'utf-8')

    const result = await findContentRoutes(tempDir)
    expect(result).toHaveLength(1)
    expect(result[0].module.pageVirtualModuleId).toBe('virtual:clarify-page/api/auth/login')
    expect(result[0].module.contentVirtualModuleId).toBe('virtual:clarify-content/api/auth/login.mdx')
  })

  it('uses locale-qualified content module identities', async () => {
    for (const locale of ['zh-CN', 'en-US']) {
      mkdirSync(join(tempDir, locale), { recursive: true })
      writeFileSync(join(tempDir, locale, 'guide.md'), `# ${locale}`, 'utf-8')
    }

    const result = await findLocalizedContentRoutes(tempDir, testI18n)

    expect(result.find(route => route.locale === 'zh-CN')?.module.contentVirtualModuleId).toBe('virtual:clarify-content/zh-CN/guide.md')
    expect(result.find(route => route.locale === 'en-US')?.module.contentVirtualModuleId).toBe('virtual:clarify-content/en-US/guide.md')
  })

  it('extracts frontmatter title', async () => {
    const content = '---\ntitle: My Page\n---\n\n# Hello'
    writeFileSync(join(tempDir, 'page.mdx'), content, 'utf-8')
    const result = await findContentRoutes(tempDir)
    expect(result[0].meta.title).toBe('My Page')
  })

  it('ignores frontmatter when extracting sections', async () => {
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

    const result = await findContentRoutes(tempDir)

    expect(result[0].meta.title).toBe('入门概览')
    expect(result[0].source.frontmatter).toEqual({
      title: '入门概览',
      description: '用最短路径完成准备。',
      icon: 'lucide:rocket',
    })
    expect(result[0].source.content).toBe('# 入门概览\n## 首次验证')
    expect(result[0].meta.sections).toEqual([{ id: '首次验证', title: '首次验证', level: 2 }])
  })

  it('runs content transforms before extracting metadata', async () => {
    writeFileSync(join(tempDir, 'page.mdx'), '# Product\n\n## Pending', 'utf-8')

    const result = await findContentRoutes(tempDir, tempDir, {
      contentProcessor: createContentProcessor(input => ({
        ...input,
        content: input.content.replace('Product', 'Clarify').replace('Pending', 'Release Notes'),
      })),
    })

    expect(result[0].source.content).toBe('# Clarify\n\n## Release Notes')
    expect(result[0].meta.title).toBe('Page')
    expect(result[0].meta.sections).toEqual([{ id: 'release-notes', title: 'Release Notes', level: 2 }])
  })

  it.each([
    ['page.md', 'markdown'],
    ['page.mdx', 'markdown+jsx'],
  ])('uses canonical heading IDs and legacy aliases for %s', async (fileName, kind) => {
    const content = [
      '# 概览',
      '',
      '## 推荐：自动配置 {#auto-config}',
      '',
      '### 详细说明 {#details}',
    ].join('\n')
    writeFileSync(join(tempDir, fileName), content, 'utf-8')

    const [route] = await findContentRoutes(tempDir)

    expect(route?.kind).toBe(kind)
    expect(route?.meta.sections).toEqual([
      { id: 'auto-config', title: '推荐：自动配置', level: 2, aliases: ['推荐自动配置'] },
      { id: 'details', title: '详细说明', level: 3, aliases: ['详细说明'] },
    ])
    expect(route?.meta.headingAliases).toEqual({
      推荐自动配置: 'auto-config',
      详细说明: 'details',
    })
    expect(route?.source.content).toBe(content)
  })

  it.each([
    ['uppercase', '# 标题 {#Uppercase}', 'Invalid heading ID "Uppercase" at 1:1'],
    ['Unicode', '# 标题 {#中文}', 'Invalid heading ID "中文" at 1:1'],
    ['empty', '# 标题 {#}', 'Invalid heading ID "" at 1:1'],
    ['leading hyphen', '# 标题 {#-title}', 'Invalid heading ID "-title" at 1:1'],
  ])('reports invalid %s heading IDs', async (_name, content, detail) => {
    const filePath = join(tempDir, 'invalid.mdx')
    writeFileSync(filePath, content, 'utf-8')

    const [route] = await findContentRoutes(tempDir)

    expect(route?.diagnostic).toMatchObject({
      title: 'Heading ID error',
      filePath: 'invalid.mdx',
      details: expect.stringContaining(detail),
    })
  })

  it.each(['md', 'mdx'])('reports heading diagnostics at file-relative lines through %s frontmatter', async (extension) => {
    // Catches frontmatter stripping resetting the analyzer to body-relative
    // positions even though diagnostics identify locations in the source file.
    const content = ['---', 'title: Page', '---', '# Broken {#UPPER}'].join('\n')
    writeFileSync(join(tempDir, `frontmatter-invalid.${extension}`), content, 'utf-8')

    const [route] = await findContentRoutes(tempDir)

    expect(route?.source.content).toBe('# Broken {#UPPER}')
    expect(route?.diagnostic).toMatchObject({
      title: 'Heading ID error',
      details: expect.stringContaining('Invalid heading ID "UPPER" at 4:1'),
    })
  })

  it('reports duplicate canonical heading IDs with both locations', async () => {
    writeFileSync(join(tempDir, 'duplicate.mdx'), '# One {#same}\n\n## Two {#same}', 'utf-8')

    const [route] = await findContentRoutes(tempDir)

    expect(route?.diagnostic).toMatchObject({
      title: 'Heading ID error',
      filePath: 'duplicate.mdx',
      details: expect.stringContaining('Heading ID "same" at 3:1 conflicts with the heading at 1:1'),
    })
  })

  it('reports canonical-to-alias heading ID collisions across H1, H2, and H3', async () => {
    writeFileSync(join(tempDir, 'collision.mdx'), [
      '# Alpha {#alpha-id}',
      '',
      '## Beta',
      '',
      '### Gamma {#alpha}',
    ].join('\n'), 'utf-8')

    const [route] = await findContentRoutes(tempDir)

    expect(route?.diagnostic).toMatchObject({
      title: 'Heading ID error',
      filePath: 'collision.mdx',
      details: expect.stringContaining('Heading ID "alpha" at 5:1 conflicts with the heading at 1:1'),
    })
  })

  it('reports raw HTML ID conflicts with Markdown canonical IDs at both source locations', async () => {
    // Catches raw HTML headings bypassing the analyzer namespace and leaving
    // duplicate IDs for the browser to resolve ambiguously.
    writeFileSync(join(tempDir, 'raw-conflict.md'), [
      '<h2 id="stable">Raw</h2>',
      '',
      '## Markdown {#stable}',
    ].join('\n'), 'utf-8')

    const [route] = await findContentRoutes(tempDir)

    expect(route?.diagnostic).toMatchObject({
      title: 'Heading ID error',
      filePath: 'raw-conflict.md',
      details: expect.stringContaining('Heading ID "stable" at 3:1 conflicts with the heading at 1:1'),
    })
  })

  it.each([
    [
      'intrinsic first against a canonical ID',
      ['<h2 id="stable">Raw</h2>', '', '## Markdown {#stable}'].join('\n'),
      'Heading ID "stable" at 3:1 conflicts with the heading at 1:1',
    ],
    [
      'Markdown first against an intrinsic ID',
      ['## Markdown {#stable}', '', '<h2 id="stable">Raw</h2>'].join('\n'),
      'Heading ID "stable" at 3:1 conflicts with the heading at 1:1',
    ],
    [
      'intrinsic first against a legacy alias',
      ['<h2 id="duplicate">Raw</h2>', '', '## Duplicate {#stable}'].join('\n'),
      'Heading ID "duplicate" at 3:1 conflicts with the heading at 1:1',
    ],
    [
      'Markdown alias first against an intrinsic ID',
      ['## Duplicate {#stable}', '', '<h2 id="duplicate">Raw</h2>'].join('\n'),
      'Heading ID "duplicate" at 3:1 conflicts with the heading at 1:1',
    ],
  ])('reports static intrinsic MDX heading conflicts with source locations: %s', async (_label, content, detail) => {
    // Catches intrinsic h1-h6 elements bypassing the canonical/legacy ID
    // namespace solely because MDX represents them as JSX nodes.
    writeFileSync(join(tempDir, 'intrinsic-conflict.mdx'), content, 'utf-8')

    const [route] = await findContentRoutes(tempDir)

    expect(route?.diagnostic).toMatchObject({
      title: 'Heading ID error',
      filePath: 'intrinsic-conflict.mdx',
      details: expect.stringContaining(detail),
    })
  })

  it.each([
    ['fallback first in Markdown', 'md', '<h2>Stable</h2>\n\n## Other {#stable}'],
    ['canonical first in Markdown', 'md', '## Other {#stable}\n\n<h2>Stable</h2>'],
    ['fallback first in MDX', 'mdx', '<h2>Stable</h2>\n\n## Other {#stable}'],
    ['canonical first in MDX', 'mdx', '## Other {#stable}\n\n<h2>Stable</h2>'],
  ])('checks rendered fallback IDs against the unified namespace after legacy ordering: %s', async (_label, extension, content) => {
    // Catches canonical reservations silently suffixing a rendered heading's
    // true old ID instead of reporting the resulting DOM collision.
    writeFileSync(join(tempDir, `fallback-conflict.${extension}`), content, 'utf-8')

    const [route] = await findContentRoutes(tempDir)

    expect(route?.diagnostic).toMatchObject({
      title: 'Heading ID error',
      details: expect.stringContaining('Heading ID "stable" at 3:1 conflicts with the heading at 1:1'),
    })
  })

  it.each([
    [
      'spread before the final literal ID',
      ['<h2 {...runtimeProps} id="stable">Raw</h2>', '', '## Markdown {#stable}'].join('\n'),
    ],
    [
      'dynamic ID before the final literal ID',
      ['<h2 id={dynamicId} id="stable">Raw</h2>', '', '## Markdown {#stable}'].join('\n'),
    ],
    [
      'different literal ID before the final literal ID',
      ['<h2 id="first" id="stable">Raw</h2>', '', '## Markdown {#stable}'].join('\n'),
    ],
    [
      'dynamic title',
      ['<h2 id="stable">{dynamicTitle}</h2>', '', '## Markdown {#stable}'].join('\n'),
    ],
    [
      'unrelated dynamic named attribute',
      ['<h2 id="stable" className={tone}>Raw</h2>', '', '## Markdown {#stable}'].join('\n'),
    ],
  ])('claims a known intrinsic literal ID despite a %s', async (_label, content) => {
    // Catches known literal IDs being hidden merely because fallback-title
    // analysis or an unrelated named attribute cannot be evaluated statically.
    writeFileSync(join(tempDir, 'known-intrinsic-id.mdx'), content, 'utf-8')

    const [route] = await findContentRoutes(tempDir)

    expect(route?.diagnostic).toMatchObject({
      title: 'Heading ID error',
      filePath: 'known-intrinsic-id.mdx',
      details: expect.stringContaining('Heading ID "stable" at 3:1 conflicts with the heading at 1:1'),
    })
  })

  it('leaves custom components and dynamic intrinsic MDX headings outside static ID analysis', async () => {
    // Catches static analysis guessing runtime component output, expression
    // IDs, or expression-derived heading text.
    const content = [
      '<Heading id="duplicate">Custom</Heading>',
      '<h2 id={dynamicId}>Dynamic ID</h2>',
      '<h2 id="duplicate" {...runtimeProps}>Spread override</h2>',
      '<h2 id="duplicate" id={dynamicId}>Dynamic override</h2>',
      '<h2 id="duplicate" id="other">Literal override</h2>',
      '',
      '## Duplicate {#stable}',
    ].join('\n')
    writeFileSync(join(tempDir, 'dynamic-headings.mdx'), content, 'utf-8')

    const [route] = await findContentRoutes(tempDir)

    expect(route?.source.content).toBe(content)
    expect(route?.meta.sections).toEqual([
      { id: 'stable', title: 'Duplicate', level: 2, aliases: ['duplicate'] },
    ])
    expect(route?.diagnostic).toBeUndefined()
  })

  it.each([
    ['raw-section.md', '<h2>Duplicate</h2>\n\n## Duplicate {#stable}', ['duplicate-1']],
    ['intrinsic-section.mdx', '<h2>Duplicate</h2>\n\n## Duplicate {#stable}', ['duplicate-1']],
    ['raw-section-reversed.md', '## Duplicate {#stable}\n\n<h2>Duplicate</h2>', ['duplicate']],
    ['intrinsic-section-reversed.mdx', '## Duplicate {#stable}\n\n<h2>Duplicate</h2>', ['duplicate']],
  ])('keeps rendered headings out of route sections while preserving ordered aliases for %s', async (fileName, content, aliases) => {
    // Catches namespace analysis accidentally promoting raw H2/H3 elements
    // into navigation sections or reserving their true legacy fallback IDs.
    writeFileSync(join(tempDir, fileName), content, 'utf-8')

    const [route] = await findContentRoutes(tempDir)

    expect(route?.meta.sections).toEqual([
      { id: 'stable', title: 'Duplicate', level: 2, aliases },
    ])
    expect(route?.meta.headingAliases).toEqual({ [aliases[0]!]: 'stable' })
    expect(route?.diagnostic).toBeUndefined()
  })

  it('suffixes repeated automatic headings without producing a diagnostic', async () => {
    writeFileSync(join(tempDir, 'repeated.mdx'), '# 标题\n\n## 重复\n\n### 重复', 'utf-8')

    const [route] = await findContentRoutes(tempDir)

    expect(route?.meta.sections).toEqual([
      { id: '重复', title: '重复', level: 2 },
      { id: '重复-1', title: '重复', level: 3 },
    ])
    expect(route?.diagnostic).toBeUndefined()
  })

  it('runs content transforms before reading frontmatter title', async () => {
    writeFileSync(join(tempDir, 'page.mdx'), '---\ntitle: Product\ndescription: Tagline\n---\n\n# Hello', 'utf-8')

    const result = await findContentRoutes(tempDir, tempDir, {
      contentProcessor: createContentProcessor(input => ({
        ...input,
        frontmatter: {
          ...input.frontmatter,
          title: 'Clarify',
          description: 'Docs that stay in sync',
        },
      })),
    })

    expect(result[0].meta.title).toBe('Clarify')
    expect(result[0].meta.description).toBe('Docs that stay in sync')
  })

  it('records a diagnostic when MDX content cannot be compiled', async () => {
    writeFileSync(join(tempDir, 'broken.mdx'), '# Hello\n\n<Thing', 'utf-8')

    const result = await findContentRoutes(tempDir)

    expect(result[0].diagnostic).toMatchObject({
      kind: 'markdown+jsx',
      title: 'MDX syntax error',
      filePath: 'broken.mdx',
      message: expect.stringContaining('could not be compiled'),
      details: expect.stringContaining('Unexpected end of file'),
    })
  })

  it('compiles valid .md files without producing a diagnostic', async () => {
    writeFileSync(join(tempDir, 'quick-start.md'), '# Quick Start\n\n<img src="/hero.png">', 'utf-8')

    const result = await findContentRoutes(tempDir)

    expect(result).toHaveLength(1)
    expect(result[0].path).toBe('/quick-start')
    expect(result[0].diagnostic).toBeUndefined()
  })

  it('falls back to filename stem for title', async () => {
    writeFileSync(join(tempDir, 'quick-start.mdx'), '# Hello', 'utf-8')
    const result = await findContentRoutes(tempDir)
    expect(result[0].meta.title).toBe('Quick Start')
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

  it('discovers source/{locale} routes with locale-aware paths', async () => {
    mkdirSync(join(tempDir, 'zh-CN'), { recursive: true })
    mkdirSync(join(tempDir, 'en-US'), { recursive: true })
    writeFileSync(join(tempDir, 'zh-CN', 'index.mdx'), '# 首页', 'utf-8')
    writeFileSync(join(tempDir, 'zh-CN', 'guide.mdx'), '# 指南', 'utf-8')
    writeFileSync(join(tempDir, 'en-US', 'index.mdx'), '# Home', 'utf-8')
    writeFileSync(join(tempDir, 'en-US', 'guide.mdx'), '# Guide', 'utf-8')

    const result = await findLocalizedContentRoutes(tempDir, testI18n)
    expect(result.map(route => route.path)).toEqual(expect.arrayContaining(['/zh-CN', '/zh-CN/guide', '/en-US', '/en-US/guide']))
    expect(result.find(route => route.path === '/en-US/guide')).toMatchObject({
      basePath: '/guide',
      locale: 'en-US',
    })
    expect(result.find(route => route.path === '/zh-CN/guide')?.alternates).toEqual({
      'zh-CN': '/zh-CN/guide',
      'en-US': '/en-US/guide',
    })
  })

  it('creates fallback routes from default locale when translation is missing', async () => {
    mkdirSync(join(tempDir, 'zh-CN'), { recursive: true })
    writeFileSync(join(tempDir, 'zh-CN', 'guide.mdx'), '# 指南', 'utf-8')

    const result = await findLocalizedContentRoutes(tempDir, testI18n)
    expect(result.find(route => route.path === '/en-US/guide')).toMatchObject({
      basePath: '/guide',
      locale: 'en-US',
      isFallback: true,
      meta: { title: 'Guide' },
    })
  })

  it('omits missing translation alternates when fallback is disabled', async () => {
    mkdirSync(join(tempDir, 'zh-CN'), { recursive: true })
    mkdirSync(join(tempDir, 'en-US'), { recursive: true })
    writeFileSync(join(tempDir, 'zh-CN', 'guide.mdx'), '# 指南', 'utf-8')
    writeFileSync(join(tempDir, 'en-US', 'index.mdx'), '# Home', 'utf-8')

    const result = await findLocalizedContentRoutes(tempDir, { ...testI18n, missing: 'hide' })
    expect(result.find(route => route.path === '/zh-CN/guide')?.alternates).toEqual({
      'zh-CN': '/zh-CN/guide',
    })
  })
})
