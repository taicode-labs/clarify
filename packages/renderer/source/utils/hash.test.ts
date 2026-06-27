import { describe, expect, it } from 'vitest'

import { safeDecodeURIComponent } from './hash'

describe('safeDecodeURIComponent', () => {
  it('decodes valid URI components', () => {
    expect(safeDecodeURIComponent('hello%20world')).toBe('hello world')
  })

  it('decodes CJK characters', () => {
    expect(safeDecodeURIComponent('%E4%B8%AD%E6%96%87')).toBe('中文')
  })

  it('returns original string on malformed input', () => {
    expect(safeDecodeURIComponent('%E0%A4%A')).toBe('%E0%A4%A')
  })

  it('returns empty string as-is', () => {
    expect(safeDecodeURIComponent('')).toBe('')
  })

  it('preserves plain text', () => {
    expect(safeDecodeURIComponent('plain-text')).toBe('plain-text')
  })
})
