import { compile, type CompileOptions } from '@mdx-js/mdx'
import rehypeRaw from 'rehype-raw'
import { describe, expect, it, vi } from 'vitest'

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
  it('adds stable ids to headings through the shared pipeline', async () => {
    const compiled = String(await compile([
      '# Overview',
      '',
      '## 中文标题',
      '',
      '### 中文标题',
      '',
      '<h2 id="custom-id">Custom</h2>',
    ].join('\n'), {
      jsx: true,
      remarkPlugins: testRemarkPlugins,
      rehypePlugins,
    }))

    expect(compiled).toContain('<_components.h1 id="overview">')
    expect(compiled).toContain('<_components.h2 id="中文标题">')
    expect(compiled).toContain('<_components.h3 id="中文标题-1">')
    expect(compiled).toContain('<h2 id="custom-id">')
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
    const result = await compileMdxContent('<BrokenComponent>\nThis tag never closes\n', '/tmp/project/source/broken.mdx', '/tmp/project')

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
