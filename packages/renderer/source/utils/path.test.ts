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

  it('returns true when one path has an explicit locale prefix', () => {
    expect(isSameRoutePath('/api', '/zh-CN/api', 'zh-CN')).toBe(true)
    expect(isSameRoutePath('/en/api', '/api', 'en')).toBe(true)
  })

  it('preserves query and hash matching with locale prefixes', () => {
    expect(isSameRoutePath('/api?group=pet', '/zh-CN/api?group=pet', 'zh-CN')).toBe(true)
    expect(isSameRoutePath('/api#pets', '/zh-CN/api#pets', 'zh-CN')).toBe(true)
  })

  it('returns false for different explicit locale prefixes', () => {
    expect(isSameRoutePath('/zh-CN/api', '/en-US/api', 'zh-CN')).toBe(false)
  })

  it('returns false when locale prefix is not provided', () => {
    expect(isSameRoutePath('/api', '/zh-CN/api')).toBe(false)
  })

  it('returns false for different paths', () => {
    expect(isSameRoutePath('/docs', '/api')).toBe(false)
  })

  it('returns false when either is undefined', () => {
    expect(isSameRoutePath(undefined, '/docs')).toBe(false)
    expect(isSameRoutePath('/docs', undefined)).toBe(false)
  })
})
