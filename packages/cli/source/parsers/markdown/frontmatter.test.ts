import { describe, it, expect } from 'vitest'

import { extractFrontmatter, parseFrontmatter, stripFrontmatter } from '../../../../frontmatter.js'

describe('extractFrontmatter', () => {
  it('extracts basic frontmatter', () => {
    const content = '---\ntitle: Hello\ndescription: World\n---\n\n# Body'
    const result = extractFrontmatter(content)
    expect(result.title).toBe('Hello')
    expect(result.description).toBe('World')
  })

  it('returns empty object when no frontmatter', () => {
    const result = extractFrontmatter('# Hello')
    expect(result).toEqual({})
  })

  it('trims quotes from values', () => {
    const content = '---\ntitle: "Quoted"\n---\n'
    const result = extractFrontmatter(content)
    expect(result.title).toBe('Quoted')
  })

  it('handles single quotes', () => {
    const content = "---\ntitle: 'Single Quoted'\n---\n"
    const result = extractFrontmatter(content)
    expect(result.title).toBe('Single Quoted')
  })

  it('ignores content after frontmatter', () => {
    const content = '---\ntitle: A\n---\n\n# B\n\nC: D'
    const result = extractFrontmatter(content)
    expect(result.title).toBe('A')
    expect(result['C']).toBeUndefined()
  })

  it('handles values containing colons', () => {
    const content = '---\ndescription: "See https://example.com/docs"\n---\n'
    const result = extractFrontmatter(content)
    expect(result.description).toBe('See https://example.com/docs')
  })

  it('preserves non-string YAML values parsed by gray-matter', () => {
    const content = '---\ndraft: false\ntags:\n  - api\n  - docs\n---\n'
    const result = extractFrontmatter(content)
    expect(result.draft).toBe(false)
    expect(result.tags).toEqual(['api', 'docs'])
  })
})

describe('parseFrontmatter', () => {
  it('parses metadata and normalized body content once', () => {
    const content = [
      '---',
      'title: 入门概览',
      'icon: lucide:rocket',
      '---',
      '',
      '# 正文标题',
    ].join('\n')

    expect(parseFrontmatter(content)).toEqual({
      frontmatter: { title: '入门概览', icon: 'lucide:rocket' },
      content: '# 正文标题',
    })
  })
})

describe('stripFrontmatter', () => {
  it('removes YAML frontmatter and keeps body content', () => {
    const content = [
      '---',
      'title: 入门概览',
      'description: 用最短路径完成准备。',
      'icon: lucide:rocket',
      '---',
      '',
      '# 正文标题',
    ].join('\n')

    expect(stripFrontmatter(content)).toBe('# 正文标题')
  })

  it('keeps content unchanged when there is no frontmatter', () => {
    expect(stripFrontmatter('# Hello')).toBe('# Hello')
  })
})
