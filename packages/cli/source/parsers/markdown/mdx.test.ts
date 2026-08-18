import { compile, type CompileOptions } from '@mdx-js/mdx'
import rehypeRaw from 'rehype-raw'
import { describe, expect, it, vi } from 'vitest'

import { analyzeHeadings } from './headings.js'
import { compileMdxContent, rehypeParseCodeBlocks, rehypePlugins, remarkPlugins } from './mdx.js'

const testRemarkPlugins = remarkPlugins as CompileOptions['remarkPlugins']

type TestNode = {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: TestNode[]
  value?: string
}

function codeTree(language = 'ts', code = 'const answer = 42\n', codeProperties: Record<string, unknown> = {}): TestNode {
  return {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'pre',
        properties: {},
        children: [
          {
            type: 'element',
            tagName: 'code',
            properties: { className: [`language-${language}`], ...codeProperties },
            children: [{ type: 'text', value: code }],
          },
        ],
      },
    ],
  }
}

describe('mdx rehype plugins', () => {
  it.each([
    ['Markdown raw HTML with an implicit ID', 'markdown', '## Hello <em>world</em>', 'Hello world', 'hello-world', []],
    ['Markdown raw HTML with an explicit ID', 'markdown', '## Hello <em>world</em> {#stable}', 'Hello world', 'stable', ['hello-world']],
    ['Markdown image with an implicit ID', 'markdown', '## Hello ![logo](logo.png)', 'Hello ', 'hello-', []],
    ['Markdown image with an explicit ID', 'markdown', '## Hello ![logo](logo.png) {#stable}', 'Hello ', 'stable', ['hello-']],
    ['MDX image with an implicit ID', 'markdown+jsx', '## Hello ![logo](logo.png)', 'Hello ', 'hello-', []],
    ['MDX image with an explicit ID', 'markdown+jsx', '## Hello ![logo](logo.png) {#stable}', 'Hello ', 'stable', ['hello-']],
  ] as const)('preserves rendered heading text compatibility for %s', async (_label, kind, source, title, canonicalId, legacyIds) => {
    // Catches mdast image alt text leaking into heading metadata and IDs while
    // retaining descendant text from raw inline HTML in Markdown.
    const analysis = analyzeHeadings(source, { kind })
    const compiled = String(await compile(analysis.normalizedContent, {
      ...(kind === 'markdown'
        ? {
            format: 'md',
            remarkRehypeOptions: { allowDangerousHtml: true },
            rehypePlugins: [rehypeRaw, ...rehypePlugins],
          }
        : { rehypePlugins }),
      jsx: true,
      remarkPlugins: testRemarkPlugins,
    }))

    expect(analysis.headings).toEqual([
      expect.objectContaining({ title, canonicalId, legacyIds }),
    ])
    expect(compiled).toContain(`id="${canonicalId}"`)
    expect(analysis.diagnostic).toBeUndefined()
  })

  it.each([
    ['bare without whitespace', '<h2/>', '<h2 id=""/>'],
    ['bare', '<h2 />', '<h2 id="" />'],
    ['with static attributes', '<h2 className="x" />', '<h2 className="x" id="" />'],
    ['with a quoted greater-than sign', '<h2 data-label="a > b" />', '<h2 data-label="a > b" id="" />'],
  ])('inserts fallback IDs before the slash of %s self-closing intrinsic MDX headings', async (_label, source, normalizedContent) => {
    // Catches compiler-internal ID insertion producing `<h2 / id="">`,
    // which is invalid MDX and replaces a valid author element with a syntax error.
    const analysis = analyzeHeadings(source, { kind: 'markdown+jsx' })

    expect(analysis.normalizedContent).toBe(normalizedContent)
    await expect(compile(analysis.normalizedContent, {
      jsx: true,
      remarkPlugins: testRemarkPlugins,
      rehypePlugins,
    })).resolves.toBeDefined()
  })

  it('accepts NBSP as intrinsic MDX attribute whitespace when inserting a fallback ID', async () => {
    // Catches the shared scanner applying raw HTML whitespace rules to MDX,
    // then treating the greater-than sign in a quoted value as the tag end.
    const analysis = analyzeHeadings('<h2\u00A0data-label="a > b">Title</h2>', { kind: 'markdown+jsx' })

    expect(analysis.normalizedContent).toBe('<h2\u00A0data-label="a > b" id="title">Title</h2>')
    const compiled = String(await compile(analysis.normalizedContent, {
      jsx: true,
      remarkPlugins: testRemarkPlugins,
      rehypePlugins,
    }))
    expect(compiled).toContain('<h2 data-label="a > b" id="title">')
  })

  it.each([
    [
      'MDX intrinsic first',
      ['<h2>Duplicate</h2>', '', '## Duplicate {#stable}'].join('\n'),
      ['duplicate-1', 'stable'],
    ],
    [
      'Markdown first',
      ['## Duplicate {#stable}', '', '<h2>Duplicate</h2>'].join('\n'),
      ['stable', 'duplicate-1'],
    ],
  ])('keeps static intrinsic MDX fallback IDs out of the Markdown alias namespace with %s', async (_label, source, expectedIds) => {
    // Catches an intrinsic MDX heading claiming a legacy alias before the
    // Markdown heading's canonical ID is applied by the shared pipeline.
    const analysis = analyzeHeadings(source, { kind: 'markdown+jsx' })
    const compiled = String(await compile(analysis.normalizedContent, {
      jsx: true,
      remarkPlugins: testRemarkPlugins,
      rehypePlugins,
    }))
    const ids = [...compiled.matchAll(/<(?:h2|_components\.h2) id="([^"]+)">/g)].map(match => match[1])

    expect(ids).toEqual(expectedIds)
    expect(analysis.headings).toEqual([
      expect.objectContaining({ title: 'Duplicate', canonicalId: 'stable', legacyIds: ['duplicate'] }),
    ])
    expect(analysis.diagnostic).toBeUndefined()
  })

  it.each([
    [
      'Markdown first',
      ['## Duplicate', '', '<h2>Duplicate</h2>'].join('\n'),
      ['duplicate', 'duplicate-1'],
    ],
    [
      'raw HTML first',
      ['<h2>Duplicate</h2>', '', '## Duplicate'].join('\n'),
      ['duplicate-1', 'duplicate'],
    ],
    [
      'Markdown explicit ID first',
      ['## Duplicate {#stable}', '', '<h2>Duplicate</h2>'].join('\n'),
      ['stable', 'duplicate-1'],
    ],
    [
      'raw HTML first before a Markdown legacy alias',
      ['<h2>Duplicate</h2>', '', '## Duplicate {#stable}'].join('\n'),
      ['duplicate-1', 'stable'],
    ],
  ])('keeps mixed duplicate heading IDs unique with %s', async (_label, source, expectedIds) => {
    // Catches the fallback slugger skipping canonical Markdown headings or
    // assigning a raw heading an ID reserved by a later canonical heading.
    const analysis = analyzeHeadings(source, { kind: 'markdown' })
    const compiled = String(await compile(analysis.normalizedContent, {
      format: 'md',
      jsx: true,
      remarkPlugins: testRemarkPlugins,
      remarkRehypeOptions: { allowDangerousHtml: true },
      rehypePlugins: [rehypeRaw, ...rehypePlugins],
    }))
    const ids = [...compiled.matchAll(/<_components\.h2 id="([^"]+)">/g)].map(match => match[1])

    expect(ids).toEqual(expectedIds)
  })

  it('preserves entity source offsets from analysis through Markdown compilation', async () => {
    // Catches decoded mdast text indices being reused as raw source offsets,
    // which corrupts content before an explicit marker when an entity shrinks.
    const analysis = analyzeHeadings('## A &amp; B {#stable}', { kind: 'markdown' })

    expect(analysis.normalizedContent).toBe('## A &amp; B [](clarify-internal-heading-id:stable)')
    expect(analysis.headings).toEqual([
      expect.objectContaining({ title: 'A & B', canonicalId: 'stable', legacyIds: ['a--b'] }),
    ])

    const compiled = String(await compile(analysis.normalizedContent, {
      format: 'md',
      jsx: true,
      remarkPlugins: testRemarkPlugins,
      remarkRehypeOptions: { allowDangerousHtml: true },
      rehypePlugins: [rehypeRaw, ...rehypePlugins],
    }))

    expect(compiled).toContain('<_components.h2 id="stable">')
    expect(compiled).toContain('{"A & B"}')
    expect(compiled).not.toContain('{#stable}')
  })

  it('preserves escaped source offsets from analysis through MDX compilation', async () => {
    // Catches backslash escapes shortening mdast text and shifting the raw
    // marker edit into visible heading content.
    const analysis = analyzeHeadings('## Use \\*literal\\* {#escaped}', { kind: 'markdown+jsx' })

    expect(analysis.normalizedContent).toBe('## Use \\*literal\\* [](clarify-internal-heading-id:escaped)')
    expect(analysis.headings).toEqual([
      expect.objectContaining({ title: 'Use *literal*', canonicalId: 'escaped', legacyIds: ['use-literal'] }),
    ])

    const compiled = String(await compile(analysis.normalizedContent, {
      jsx: true,
      remarkPlugins: testRemarkPlugins,
      rehypePlugins,
    }))

    expect(compiled).toContain('<_components.h2 id="escaped">')
    expect(compiled).toContain('{"Use *literal*"}')
    expect(compiled).not.toContain('{#escaped}')
  })

  it('adds IDs to raw HTML Markdown headings without replacing canonical Markdown IDs', async () => {
    // Catches removing rehype-slug from the Markdown raw-HTML pipeline without
    // restoring IDs for H1-H6 elements the Markdown analyzer cannot see.
    const analysis = analyzeHeadings([
      '# Markdown heading {#canonical-heading}',
      '',
      '<h2>Raw HTML heading</h2>',
    ].join('\n'), { kind: 'markdown' })

    const compiled = String(await compile(analysis.normalizedContent, {
      format: 'md',
      jsx: true,
      remarkPlugins: testRemarkPlugins,
      remarkRehypeOptions: { allowDangerousHtml: true },
      rehypePlugins: [rehypeRaw, ...rehypePlugins],
    }))

    expect(compiled).toContain('<_components.h1 id="canonical-heading">')
    expect(compiled).toContain('<_components.h2 id="raw-html-heading">')
    expect(compiled).not.toContain('<_components.h1 id="markdown-heading">')
  })

  it('preserves an unquoted raw HTML attribute ending in slash when inserting a fallback ID', async () => {
    // Catches the slash in `data-x=/ ` being mistaken for a self-closing
    // marker and moving the generated ID inside the unquoted attribute value.
    const analysis = analyzeHeadings('<h2 data-x=/ >Title</h2>', { kind: 'markdown' })

    expect(analysis.normalizedContent).toBe('<h2 data-x=/  id="title">Title</h2>')
    const compiled = String(await compile(analysis.normalizedContent, {
      format: 'md',
      jsx: true,
      remarkPlugins: testRemarkPlugins,
      remarkRehypeOptions: { allowDangerousHtml: true },
      rehypePlugins: [rehypeRaw, ...rehypePlugins],
    }))
    expect(compiled).toContain('<_components.h2 data-x="/" id="title">')
  })

  it('treats a slash after an attribute equals sign as an unquoted raw HTML value', async () => {
    // Catches the first character of an unquoted value being classified as a
    // self-closing marker before the scanner enters its value state.
    const analysis = analyzeHeadings('<h2 data-x=/>Title</h2>', { kind: 'markdown' })

    expect(analysis.normalizedContent).toBe('<h2 data-x=/ id="title">Title</h2>')
    const compiled = String(await compile(analysis.normalizedContent, {
      format: 'md',
      jsx: true,
      remarkPlugins: testRemarkPlugins,
      remarkRehypeOptions: { allowDangerousHtml: true },
      rehypePlugins: [rehypeRaw, ...rehypePlugins],
    }))
    expect(compiled).toContain('<_components.h2 data-x="/" id="title">')
  })

  it('preserves a trailing slash in an unquoted raw HTML URL when inserting a fallback ID', async () => {
    // Catches a slash that is adjacent to `>` but still belongs to an
    // unquoted attribute value being consumed as a self-closing marker.
    const analysis = analyzeHeadings('<h2 data-url=https://example.com/>Title</h2>', { kind: 'markdown' })

    expect(analysis.normalizedContent).toBe('<h2 data-url=https://example.com/ id="title">Title</h2>')
    const compiled = String(await compile(analysis.normalizedContent, {
      format: 'md',
      jsx: true,
      remarkPlugins: testRemarkPlugins,
      remarkRehypeOptions: { allowDangerousHtml: true },
      rehypePlugins: [rehypeRaw, ...rehypePlugins],
    }))
    expect(compiled).toContain('<_components.h2 data-url="https://example.com/" id="title">')
  })

  it('preserves an NBSP and trailing slash in an unquoted raw HTML value', async () => {
    // Catches JavaScript whitespace classification treating NBSP as HTML
    // whitespace and truncating the unquoted value before fallback ID insertion.
    const analysis = analyzeHeadings('<h2 data-x=foo\u00A0/>Title</h2>', { kind: 'markdown' })

    expect(analysis.normalizedContent).toBe('<h2 data-x=foo\u00A0/ id="title">Title</h2>')
    const compiled = String(await compile(analysis.normalizedContent, {
      format: 'md',
      jsx: true,
      remarkPlugins: testRemarkPlugins,
      remarkRehypeOptions: { allowDangerousHtml: true },
      rehypePlugins: [rehypeRaw, ...rehypePlugins],
    }))
    expect(compiled).toContain('<_components.h2 data-x="foo\u00A0/" id="title">')
  })

  it('applies canonical IDs from normalized headings through the shared pipeline', async () => {
    // Catches a regression where the compiler leaves its internal link in the
    // output or lets the generic slugger derive a non-canonical heading ID.
    const compiled = String(await compile([
      '# Overview [](clarify-internal-heading-id:overview)',
      '',
      '## 推荐：自动配置 [](clarify-internal-heading-id:auto-config)',
      '',
      '### 中文标题 [](clarify-internal-heading-id:中文标题)',
      '',
      '#### 中文标题 [](clarify-internal-heading-id:中文标题-1)',
      '',
      '<h2 id="custom-id">Custom</h2>',
    ].join('\n'), {
      jsx: true,
      remarkPlugins: testRemarkPlugins,
      rehypePlugins,
    }))

    expect(compiled).toContain('<_components.h1 id="overview">')
    expect(compiled).toContain('<_components.h2 id="auto-config">')
    expect(compiled).toContain('<_components.h3 id="中文标题">')
    expect(compiled).toContain('<_components.h4 id="中文标题-1">')
    expect(compiled).toContain('<h2 id="custom-id">')
    expect(compiled).not.toContain('clarify-internal-heading-id')
    expect(compiled).not.toContain('{#auto-config}')
  })

  it('copies fenced code language to the pre element', () => {
    const tree = codeTree('tsx')
    const transformer = rehypeParseCodeBlocks()

    transformer(tree)

    const pre = tree.children?.[0]
    const code = pre?.children?.[0]
    expect(pre?.properties?.language).toBe('tsx')
    expect(code?.properties?.language).toBe('tsx')
  })

  it('copies fenced code presentation metadata to the pre element', () => {
    const tree = codeTree('ts', 'export default {}\n', {
      title: 'Named tab',
      label: 'clarify.ts',
      tag: 'config',
    })
    const transformer = rehypeParseCodeBlocks()

    transformer(tree)

    const pre = tree.children?.[0]
    const code = pre?.children?.[0]
    expect(pre?.properties?.title).toBe('Named tab')
    expect(pre?.properties?.label).toBe('clarify.ts')
    expect(pre?.properties?.tag).toBe('config')
    expect(code?.properties?.title).toBe('Named tab')
    expect(code?.properties?.label).toBe('clarify.ts')
    expect(code?.properties?.tag).toBe('config')
  })

  it('passes double-quoted fenced code meta attributes to the code component', async () => {
    const compiled = String(await compile('```ts title="Base preset" label="clarify.ts"\nexport default {}\n```', {
      jsx: true,
      remarkPlugins: testRemarkPlugins,
    }))

    expect(compiled).toContain('title="Base preset"')
    expect(compiled).toContain('label="clarify.ts"')
  })

  it('passes single-quoted fenced code meta attributes to the code component', async () => {
    const compiled = String(await compile("```ts title='Single quoted title' label='clarify.ts'\nexport default {}\n```", {
      jsx: true,
      remarkPlugins: testRemarkPlugins,
    }))

    expect(compiled).toContain('title="Single quoted title"')
    expect(compiled).toContain('label="clarify.ts"')
  })

  it('passes bare fenced code meta attributes to the code component', async () => {
    const compiled = String(await compile('```ts title=Default label=clarify.ts\nexport default {}\n```', {
      jsx: true,
      remarkPlugins: testRemarkPlugins,
    }))

    expect(compiled).toContain('title="Default"')
    expect(compiled).toContain('label="clarify.ts"')
  })

  it('passes boolean-style fenced code meta attributes as string values', async () => {
    const compiled = String(await compile('```ts title="No copy" copyable disabled\nexport default {}\n```', {
      jsx: true,
      remarkPlugins: testRemarkPlugins,
    }))

    expect(compiled).toContain('title="No copy"')
    expect(compiled).toContain('copyable="true"')
    expect(compiled).toContain('disabled="true"')
  })

  it('passes hyphenated fenced code meta attributes to the code component', async () => {
    const compiled = String(await compile('```ts title="With filename" data-filename="clarify.ts"\nexport default {}\n```', {
      jsx: true,
      remarkPlugins: testRemarkPlugins,
    }))

    expect(compiled).toContain('title="With filename"')
    expect(compiled).toContain('data-filename="clarify.ts"')
  })

  it('does not pass markdown code meta to inline code', async () => {
    const compiled = String(await compile('Use `defineConfig` in prose.', {
      jsx: true,
      remarkPlugins: testRemarkPlugins,
    }))

    expect(compiled).not.toContain('title=')
    expect(compiled).not.toContain('label=')
  })

  it('preserves fenced code meta attributes through the full MDX pipeline', async () => {
    const compiled = String(await compile('```ts title="Full pipeline" label="clarify.ts"\nexport default {}\n```', {
      jsx: true,
      remarkPlugins: testRemarkPlugins,
      rehypePlugins,
    }))

    expect(compiled).toContain('<_components.pre className="shiki css-variables"')
    expect(compiled).toContain('title="Full pipeline"')
    expect(compiled).toContain('label="clarify.ts"')
    expect(compiled).toContain('<_components.code className="language-ts">')
    expect(compiled).toContain('var(--shiki-token-keyword)')
    expect(compiled).toContain('{"export"}')
  })

  it('falls back to plain text for unknown fenced code languages', async () => {
    const compiled = String(await compile('```custom-language\nfirst line\nsecond line\n```', {
      jsx: true,
      remarkPlugins: testRemarkPlugins,
      rehypePlugins,
    }))

    expect(compiled).toContain('<_components.pre className="shiki css-variables"')
    expect(compiled).toContain('<_components.code className="language-text">')
    expect(compiled).toContain('{"first line"}')
    expect(compiled).toContain('{"second line"}')
  })

  it('deduplicates repeated MDX parser messages in diagnostics', async () => {
    const result = await compileMdxContent('<BrokenComponent>\nThis tag never closes\n')

    expect(result.ok).toBe(false)

    if (!result.ok) {
      const details = result.diagnostic.details ?? ''
      const occurrences = (details.match(/Expected a closing tag for `<BrokenComponent>`/g) ?? []).length
      expect(occurrences).toBe(1)
      expect(result.diagnostic.details).not.toContain('Line undefined, column undefined')
    }
  })

  it('uses the provided root directory when normalizing diagnostic file paths', async () => {
    const result = await compileMdxContent('<BrokenComponent>\nThis tag never closes\n', { filePath: '/tmp/project/source/broken.mdx', projectRoot: '/tmp/project' })

    expect(result.ok).toBe(false)

    if (!result.ok) {
      expect(result.diagnostic.filePath).toBe('source/broken.mdx')
    }
  })

  it('does not invoke Shiki during the diagnostic compile', async () => {
    // Content with a fenced code block that WOULD trigger Shiki if the rehype
    // pipeline ran. The diagnostic path must skip rehypePlugins entirely so
    // code highlighting only happens once, at Vite build time.
    //
    // We use a fresh module instance (`vi.resetModules` + dynamic import) so a
    // previous full-pipeline compile cannot mask whether diagnostics initialize
    // Shiki. `vi.doMock` (not `vi.mock`) keeps the mock scoped to this test.
    const getHighlighterCalls: number[] = []
    vi.doMock('shiki', () => ({
      bundledLanguages: {},
      createCssVariablesTheme: () => ({ name: 'css-variables' }),
      createHighlighter: () => {
        getHighlighterCalls.push(1)
        return Promise.resolve({ codeToHtml: () => '' })
      },
      default: {
        getHighlighter: () => {
          getHighlighterCalls.push(1)
          return Promise.resolve({ codeToThemedTokens: () => [] })
        },
      },
      getHighlighter: () => {
        getHighlighterCalls.push(1)
        return Promise.resolve({ codeToThemedTokens: () => [] })
      },
    }))

    vi.resetModules()
    const { compileMdxContent: freshCompileMdxContent } = await import('./mdx.js')

    const result = await freshCompileMdxContent('```ts\nconst x = 1\n```\n\n# ok')

    expect(result.ok).toBe(true)
    expect(getHighlighterCalls).toHaveLength(0)

    vi.doUnmock('shiki')
    vi.resetModules()
  })

  it('still surfaces MDX/JSX syntax errors without the rehype pipeline', async () => {
    // A JSX-level error that remark.parse() alone cannot catch - this proves
    // the diagnostic path still runs the MDX compiler (just without rehype).
    const result = await compileMdxContent('<BrokenComponent>\nThis tag never closes\n')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.diagnostic.details).toContain('Expected a closing tag for `<BrokenComponent>`')
    }
  })

  it('enables GitHub Flavored Markdown syntax', async () => {
    const compiled = String(await compile([
      '- [x] Done',
      '',
      '~~removed~~',
      '',
      'https://example.com',
      '',
      '| A | B |',
      '| - | - |',
      '| 1 | 2 |',
    ].join('\n'), { jsx: true, remarkPlugins: testRemarkPlugins }))

    expect(compiled).toContain('className="contains-task-list"')
    expect(compiled).toContain('className="task-list-item"')
    expect(compiled).toContain('<_components.del>')
    expect(compiled).toContain('href="https://example.com"')
    expect(compiled).toContain('<_components.table>')
  })

  it('allows raw HTML in markdown mode when rehype-raw is enabled', async () => {
    const compiled = String(await compile('# Intro\n\n<img src="/hero.png">', {
      format: 'md',
      jsx: true,
      remarkPlugins: testRemarkPlugins,
      remarkRehypeOptions: { allowDangerousHtml: true },
      rehypePlugins: [rehypeRaw],
    }))

    expect(compiled).toContain('<_components.img src="/hero.png"')
  })
})
