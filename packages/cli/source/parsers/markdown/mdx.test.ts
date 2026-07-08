import { compile, type CompileOptions } from '@mdx-js/mdx'
import { describe, expect, it } from 'vitest'

import { compileMdxContent, rehypeParseCodeBlocks, rehypePlugins, rehypeShiki, rehypeSlugSections, remarkPlugins } from '../../../../mdx.js'

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
  it('adds stable ids to Chinese section headings', () => {
    const tree: TestNode = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'h2',
          properties: {},
          children: [{ type: 'text', value: '中文标题' }],
        },
        {
          type: 'element',
          tagName: 'h3',
          properties: {},
          children: [{ type: 'text', value: '中文标题' }],
        },
      ],
    }

    rehypeSlugSections()(tree)

    expect(tree.children?.[0]?.properties?.id).toBe('中文标题')
    expect(tree.children?.[1]?.properties?.id).toBe('中文标题-1')
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

  it('stores raw code and replaces code text with highlighted html', async () => {
    const tree = codeTree('ts')
    rehypeParseCodeBlocks()(tree)

    const transformer = rehypeShiki()
    await transformer(tree)

    const pre = tree.children?.[0]
    const code = pre?.children?.[0]
    const highlighted = code?.children?.[0]?.value ?? ''

    expect(pre?.properties?.code).toBe('const answer = 42\n')
    expect(code?.properties?.code).toBe('const answer = 42\n')
    expect(highlighted).toContain('<span')
    expect(highlighted).toContain('--shiki')
  })

  it('preserves line breaks in plain fenced code blocks', async () => {
    const tree = codeTree('txt', 'first line\nsecond line\nthird line')
    rehypeParseCodeBlocks()(tree)

    const transformer = rehypeShiki()
    await transformer(tree)

    const code = tree.children?.[0]?.children?.[0]
    const highlighted = code?.children?.[0]?.value ?? ''

    expect(highlighted).toBe('<span>first line</span>\n<span>second line</span>\n<span>third line</span>')
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

    expect(compiled).toContain('<_components.pre language="ts" title="Full pipeline" label="clarify.ts"')
    expect(compiled).toContain('<_components.code className="language-ts" title="Full pipeline" label="clarify.ts"')
    expect(compiled).toContain('language="ts"')
    expect(compiled).toContain('code="export default {}')
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
})
