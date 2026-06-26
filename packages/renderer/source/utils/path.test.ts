import { describe, expect, it } from 'vitest'
import { isSameRoutePath, normalizeRoutePath } from './path'

describe('normalizeRoutePath', () => {
  it('returns / for empty string', () => {
    expect(normalizeRoutePath('')).toBe('/')
  })

  it('strips trailing slash', () => {
    expect(normalizeRoutePath('/getting-started/')).toBe('/getting-started')
  })

  it('preserves paths without leading slash', () => {
    expect(normalizeRoutePath('getting-started')).toBe('getting-started')
  })

  it('preserves query string', () => {
    expect(normalizeRoutePath('/search?q=hello')).toBe('/search?q=hello')
  })

  it('preserves hash', () => {
    expect(normalizeRoutePath('/page#section')).toBe('/page#section')
  })

  it('collapses multiple leading slashes', () => {
    expect(normalizeRoutePath('//api/docs')).toBe('/api/docs')
  })
})

describe('isSameRoutePath', () => {
  it('returns true for identical paths', () => {
    expect(isSameRoutePath('/docs', '/docs')).toBe(true)
  })

  it('returns true when trailing slash differs', () => {
    expect(isSameRoutePath('/docs/', '/docs')).toBe(true)
  })

  it('returns false for different paths', () => {
    expect(isSameRoutePath('/docs', '/api')).toBe(false)
  })

  it('returns false when either is undefined', () => {
    expect(isSameRoutePath(undefined, '/docs')).toBe(false)
    expect(isSameRoutePath('/docs', undefined)).toBe(false)
  })
})
