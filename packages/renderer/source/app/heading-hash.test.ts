import { describe, expect, it } from 'vitest'

import { canonicalHeadingUrl, resolveHeadingHash } from './heading-hash'

describe('resolveHeadingHash', () => {
  it('resolves an encoded legacy heading through its canonical alias', () => {
    expect(resolveHeadingHash(
      '#%E6%8E%A8%E8%8D%90%E8%87%AA%E5%8A%A8%E9%85%8D%E7%BD%AE',
      { 推荐自动配置: 'auto-config' },
    )).toEqual({
      requestedId: '推荐自动配置',
      canonicalId: 'auto-config',
      wasAlias: true,
    })
  })

  it('keeps a canonical heading unchanged', () => {
    expect(resolveHeadingHash('#auto-config', { 推荐自动配置: 'auto-config' })).toEqual({
      requestedId: 'auto-config',
      canonicalId: 'auto-config',
      wasAlias: false,
    })
  })

  it('keeps an unknown valid fragment unchanged', () => {
    expect(resolveHeadingHash('#future-heading', { 推荐自动配置: 'auto-config' })).toEqual({
      requestedId: 'future-heading',
      canonicalId: 'future-heading',
      wasAlias: false,
    })
  })

  it('does not resolve inherited object properties as aliases', () => {
    expect(resolveHeadingHash('#constructor', { 推荐自动配置: 'auto-config' })).toEqual({
      requestedId: 'constructor',
      canonicalId: 'constructor',
      wasAlias: false,
    })
  })

  it('rejects malformed percent encoding without throwing', () => {
    expect(resolveHeadingHash('#%E0%A4%A', { 推荐自动配置: 'auto-config' })).toBeUndefined()
  })
})

describe('canonicalHeadingUrl', () => {
  it('preserves the current path and query while encoding the canonical heading', () => {
    expect(canonicalHeadingUrl({ pathname: '/guide', search: '?lang=zh' }, 'auto-config'))
      .toBe('/guide?lang=zh#auto-config')
  })
})
