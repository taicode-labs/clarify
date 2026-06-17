import { compile } from '@mdx-js/mdx'
import { describe, expect, it } from 'vitest'

import { rehypeParseCodeBlocks, rehypeShiki, rehypeSlugSections, remarkPlugins } from './mdx.js'

type TestNode = {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: TestNode[]
  value?: string
}

function codeTree(language = 'ts'): TestNode {
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
            properties: { className: [`language-${language}`] },
            children: [{ type: 'text', value: 'const answer = 42\n' }],
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
    ].join('\n'), { jsx: true, remarkPlugins }))

    expect(compiled).toContain('className="contains-task-list"')
    expect(compiled).toContain('className="task-list-item"')
    expect(compiled).toContain('<_components.del>')
    expect(compiled).toContain('href="https://example.com"')
    expect(compiled).toContain('<_components.table>')
  })
})
