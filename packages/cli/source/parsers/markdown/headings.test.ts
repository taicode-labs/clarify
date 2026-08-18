import { describe, expect, it } from 'vitest'

import { analyzeHeadings } from './headings.js'

describe('analyzeHeadings', () => {
  it.each([
    [
      'inline code',
      '## Literal `{#example}`',
      'Literal {#example}',
      'literal-example',
      '## Literal `{#example}` [](clarify-internal-heading-id:literal-example)',
    ],
    [
      'escaped braces',
      '## Escaped \\{#example\\}',
      'Escaped {#example}',
      'escaped-example',
      '## Escaped \\{#example\\} [](clarify-internal-heading-id:escaped-example)',
    ],
  ])('preserves a literal marker-shaped suffix in MDX %s', (_label, source, title, canonicalId, normalizedContent) => {
    // Catches length-preserving MDX syntax masking leaking placeholder text
    // into a heading when the marker-shaped suffix is literal, not metadata.
    const result = analyzeHeadings(source, { kind: 'markdown+jsx' })

    expect(result.headings).toEqual([
      expect.objectContaining({ title, canonicalId, legacyIds: [] }),
    ])
    expect(result.normalizedContent).toBe(normalizedContent)
    expect(result.diagnostic).toBeUndefined()
  })

  it.each([
    ['ESM template', [
      'export const snippet = `',
      '## Not an ESM heading {#esm-fake}',
      '`',
    ].join('\n')],
    ['expression', [
      '{`',
      '## Not an expression heading {#expression-fake}',
      '`}',
    ].join('\n')],
    ['comment', [
      '{/*',
      '## Not a comment heading {#comment-fake}',
      '*/}',
    ].join('\n')],
    ['JSX attribute', [
      '<Example label="',
      '## Not a JSX heading {#jsx-fake}',
      '" />',
    ].join('\n')],
  ])('does not analyze heading-like text inside an MDX %s', (_label, mdxBoundary) => {
    // Catches plain Markdown parsing crossing an MDX syntax boundary and
    // rewriting JavaScript or JSX values as document headings.
    const source = [
      mdxBoundary,
      '',
      '## Real section {#real-section}',
    ].join('\n')

    const result = analyzeHeadings(source, { kind: 'markdown+jsx' })

    expect(result.headings).toEqual([
      expect.objectContaining({ level: 2, title: 'Real section', canonicalId: 'real-section' }),
    ])
    expect(result.normalizedContent).toContain(mdxBoundary)
    expect(result.normalizedContent).toContain('## Real section [](clarify-internal-heading-id:real-section)')
    expect(result.normalizedContent).not.toContain('clarify-internal-heading-id:esm-fake')
    expect(result.normalizedContent).not.toContain('clarify-internal-heading-id:expression-fake')
    expect(result.normalizedContent).not.toContain('clarify-internal-heading-id:comment-fake')
    expect(result.normalizedContent).not.toContain('clarify-internal-heading-id:jsx-fake')
  })

  it('keeps display titles while assigning explicit and legacy IDs in document order', () => {
    // Catches a regression where the explicit marker is included in the title,
    // or an explicit ID stops the shared legacy slug sequence.
    const result = analyzeHeadings([
      '# 页面',
      '## 推荐：自动配置 {#auto-config}',
      '### 推荐：自动配置',
    ].join('\n'), { kind: 'markdown+jsx' })

    expect(result.headings).toEqual([
      expect.objectContaining({ level: 1, title: '页面', canonicalId: '页面', legacyIds: [] }),
      expect.objectContaining({ level: 2, title: '推荐：自动配置', canonicalId: 'auto-config', legacyIds: ['推荐自动配置'] }),
      expect.objectContaining({ level: 3, title: '推荐：自动配置', canonicalId: '推荐自动配置-1', legacyIds: [] }),
    ])
    expect(result.normalizedContent).not.toContain('{#auto-config}')
    expect(result.normalizedContent).toContain('clarify-internal-heading-id:auto-config')
    expect(result.diagnostic).toBeUndefined()
  })

  it('normalizes ATX, Setext, and formatted headings without exposing marker syntax', () => {
    // Catches regressions where source edits insert after ATX closing hashes,
    // retain a visible marker, or derive titles from markdown syntax.
    const result = analyzeHeadings([
      '## Closing hashes {#closing-hashes} ##',
      '',
      'Setext **heading** {#setext-heading}',
      '---',
      '',
      '#### **Formatted** heading {#formatted-heading}',
    ].join('\n'), { kind: 'markdown' })

    expect(result.headings).toEqual([
      expect.objectContaining({ title: 'Closing hashes', canonicalId: 'closing-hashes' }),
      expect.objectContaining({ title: 'Setext heading', canonicalId: 'setext-heading' }),
      expect.objectContaining({ title: 'Formatted heading', canonicalId: 'formatted-heading' }),
    ])
    expect(result.normalizedContent).toContain('## Closing hashes [](clarify-internal-heading-id:closing-hashes) ##')
    expect(result.normalizedContent).toContain('Setext **heading** [](clarify-internal-heading-id:setext-heading)')
    expect(result.normalizedContent).toContain('#### **Formatted** heading [](clarify-internal-heading-id:formatted-heading)')
    expect(result.normalizedContent).not.toContain('{#')
  })

  it('preserves the shared duplicate slug sequence across heading levels', () => {
    // Catches a regression where duplicate IDs are scoped by heading level.
    const result = analyzeHeadings([
      '# Same',
      '## Same',
      '### Same',
      '#### Same',
      '##### Same',
      '###### Same',
    ].join('\n'), { kind: 'markdown' })

    expect(result.headings.map(heading => heading.canonicalId)).toEqual([
      'same',
      'same-1',
      'same-2',
      'same-3',
      'same-4',
      'same-5',
    ])
  })

  it('reports invalid and conflicting canonical and legacy IDs with source locations', () => {
    // Catches a regression where broken IDs silently render or aliases shadow
    // a later canonical ID.
    const result = analyzeHeadings([
      '# Alpha {#duplicate}',
      '## Beta {#duplicate}',
      '### Alpha',
      '#### Broken {#UPPER}',
    ].join('\n'), { kind: 'markdown', filePath: '/project/source/guide.md', projectRoot: '/project' })

    expect(result.diagnostic).toMatchObject({
      kind: 'markdown',
      title: 'Heading ID error',
      filePath: 'source/guide.md',
    })
    expect(result.diagnostic?.details).toContain('duplicate')
    expect(result.diagnostic?.details).toContain('1:1')
    expect(result.diagnostic?.details).toContain('2:1')
    expect(result.diagnostic?.details).toContain('UPPER')
    expect(result.diagnostic?.details).toContain('4:1')
  })
})
