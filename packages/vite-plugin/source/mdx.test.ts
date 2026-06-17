import { describe, expect, it } from 'vitest'

import { rehypeParseCodeBlocks, rehypeShiki } from './mdx.js'

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
})
