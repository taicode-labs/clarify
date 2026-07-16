import { describe, expect, it } from 'vitest'

import type { Config } from '../types'

import { hasLocalePrefix, isExternalHref, localizeHref, prefixHref } from './href'

const baseConfig = {
  title: 'Test',
  description: 'Test docs',
  theme: { preset: 'default', tokens: {} as Config['theme']['tokens'], layout: {} as Config['theme']['layout'] },
  routePrefix: '/',
  assetPrefix: '/',
  locales: {
    default: 'en',
    missing: 'fallback' as const,
    locales: [
      { code: 'en', label: 'English' },
      { code: 'zh-CN', label: '中文' },
    ],
  },
  features: {
    search: { enabled: true, provider: 'pagefind' },
    editLink: { enabled: true },
    artifacts: { enabled: true, content: true, llms: true, sitemap: true, robots: true },
    themeEditor: { enabled: true },
    openapi: { enabled: true, playground: true, responsePreview: true, responseDownload: true },
  },
} satisfies Config

describe('isExternalHref', () => {
  it('returns true for http URLs', () => {
    expect(isExternalHref('https://example.com')).toBe(true)
  })

  it('returns true for protocol-relative URLs', () => {
    expect(isExternalHref('//cdn.example.com')).toBe(true)
  })

  it('returns false for relative paths', () => {
    expect(isExternalHref('/docs')).toBe(false)
  })

  it('returns false for anchor links', () => {
    expect(isExternalHref('#section')).toBe(false)
  })

  it('returns true for mailto links', () => {
    expect(isExternalHref('mailto:test@example.com')).toBe(true)
  })
})

describe('hasLocalePrefix', () => {
  it('returns true when path starts with known locale', () => {
    expect(hasLocalePrefix('/zh-CN/docs', baseConfig)).toBe(true)
  })

  it('returns false when path has no locale prefix', () => {
    expect(hasLocalePrefix('/docs', baseConfig)).toBe(false)
  })

  it('returns false for unknown locale', () => {
    expect(hasLocalePrefix('/fr/docs', baseConfig)).toBe(false)
  })
})

describe('localizeHref', () => {
  it('returns href unchanged for default locale', () => {
    expect(localizeHref('/docs', baseConfig, 'en')).toBe('/docs')
  })

  it('prepends locale for non-default locale', () => {
    expect(localizeHref('/docs', baseConfig, 'zh-CN')).toBe('/zh-CN/docs')
  })

  it('handles root path for non-default locale', () => {
    expect(localizeHref('/', baseConfig, 'zh-CN')).toBe('/zh-CN')
  })

  it('returns href unchanged when it already has locale prefix', () => {
    expect(localizeHref('/zh-CN/docs', baseConfig, 'zh-CN')).toBe('/zh-CN/docs')
  })

  it('returns external URLs unchanged', () => {
    expect(localizeHref('https://example.com', baseConfig, 'zh-CN')).toBe('https://example.com')
  })

  it('returns anchor links unchanged', () => {
    expect(localizeHref('#section', baseConfig, 'zh-CN')).toBe('#section')
  })
})

describe('prefixHref', () => {
  it('returns href unchanged when no prefix', () => {
    expect(prefixHref('/docs')).toBe('/docs')
  })

  it('prepends route prefix', () => {
    expect(prefixHref('/docs', '/app')).toBe('/app/docs')
  })

  it('handles root path with prefix', () => {
    expect(prefixHref('/', '/app')).toBe('/app')
  })

  it('returns external URLs unchanged', () => {
    expect(prefixHref('https://example.com', '/app')).toBe('https://example.com')
  })
})
