import { describe, it, expect } from 'vitest'

import { escapeHtml } from './utils.js'

describe('escapeHtml', () => {
  it('returns plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })

  it('escapes ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('escapes less-than', () => {
    expect(escapeHtml('1 < 2')).toBe('1 &lt; 2')
  })

  it('escapes greater-than', () => {
    expect(escapeHtml('2 > 1')).toBe('2 &gt; 1')
  })

  it('escapes double quotes', () => {
    expect(escapeHtml('say "hi"')).toBe('say &quot;hi&quot;')
  })

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s')
  })

  it('escapes all special characters together', () => {
    const input = `<div class="foo">Bar & Baz's</div>`
    const expected = '&lt;div class=&quot;foo&quot;&gt;Bar &amp; Baz&#39;s&lt;/div&gt;'
    expect(escapeHtml(input)).toBe(expected)
  })

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('')
  })
})
