import { describe, expect, it, vi } from 'vitest'

import { compileMarkdownContent } from './markdown.js'

describe('compileMarkdownContent', () => {
  it('compiles valid markdown with raw HTML without a diagnostic', async () => {
    const result = await compileMarkdownContent('# Quick Start\n\n<img src="/hero.png">')

    expect(result.ok).toBe(true)
  })

  it('compiles GitHub Flavored Markdown syntax', async () => {
    const result = await compileMarkdownContent([
      '- [x] Done',
      '',
      '~~removed~~',
      '',
      '| A | B |',
      '| - | - |',
      '| 1 | 2 |',
    ].join('\n'))

    expect(result.ok).toBe(true)
  })

  it('does not invoke Shiki during the diagnostic compile', async () => {
    // Content with a fenced code block that WOULD trigger Shiki if the rehype
    // pipeline ran. The diagnostic path must skip rehypePlugins entirely so
    // code highlighting only happens once, at Vite build time.
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
    const { compileMarkdownContent: freshCompileMarkdownContent } = await import('./markdown.js')

    const result = await freshCompileMarkdownContent('```ts\nconst x = 1\n```\n\n# ok')

    expect(result.ok).toBe(true)
    expect(getHighlighterCalls).toHaveLength(0)

    vi.doUnmock('shiki')
    vi.resetModules()
  })

  it('treats JSX-like syntax as raw text rather than components', async () => {
    // `<Thing` would be a syntax error in MDX mode, but in markdown mode it is
    // plain text - so no diagnostic should be produced.
    const result = await compileMarkdownContent('# Title\n\n<Thing')

    expect(result.ok).toBe(true)
  })

  it('uses the provided root directory when normalizing diagnostic file paths', async () => {
    // Force a compile failure by mocking @mdx-js/mdx to throw, so we can assert
    // the markdown diagnostic path normalizes filePath against projectRoot.
    vi.doMock('@mdx-js/mdx', () => ({
      compile: () => { throw new Error('markdown compile boom') },
    }))
    vi.resetModules()
    const { compileMarkdownContent: freshCompileMarkdownContent } = await import('./markdown.js')

    const result = await freshCompileMarkdownContent('# Title', {
      filePath: '/tmp/project/source/broken.md',
      projectRoot: '/tmp/project',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.diagnostic.kind).toBe('markdown')
      expect(result.diagnostic.title).toBe('Markdown syntax error')
      expect(result.diagnostic.filePath).toBe('source/broken.md')
      expect(result.diagnostic.details).toContain('markdown compile boom')
    }

    vi.doUnmock('@mdx-js/mdx')
    vi.resetModules()
  })
})
