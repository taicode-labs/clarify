import { describe, expect, it } from 'vitest'

import { pagefindCacheKey, resolvePagefindUrl } from './pagefind'

describe('resolvePagefindUrl', () => {
  it.each([
    ['/', '/pagefind/pagefind.js'],
    ['/docs/', '/docs/pagefind/pagefind.js'],
    ['https://cdn.example.com/site/', 'https://cdn.example.com/site/pagefind/pagefind.js'],
    ['./', './pagefind/pagefind.js'],
    ['', '/pagefind/pagefind.js'],
  ])('resolves %s against the configured asset prefix', (assetPrefix, expected) => {
    expect(resolvePagefindUrl(assetPrefix)).toBe(expected)
  })
})

describe('pagefindCacheKey', () => {
  it('separates instances by asset prefix and locale', () => {
    expect(pagefindCacheKey('/assets/', 'zh-CN')).toBe('/assets/:zh-CN')
    expect(pagefindCacheKey('/assets/', undefined)).toBe('/assets/:default')
  })
})
