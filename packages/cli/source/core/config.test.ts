import { describe, it, expect } from 'vitest'

import { clarifyProjectConfigSchema } from './config-schema.js'
import { resolveProjectConfig } from './config.js'
import { resolveBuildOptions } from './options.js'

describe('clarifyProjectConfigSchema', () => {
  it('validates project config', () => {
    expect(clarifyProjectConfigSchema.parse({
      title: 'Docs',
      navbar: { links: [{ label: 'GitHub', href: 'https://github.com', external: true }] },
      i18n: {
        defaultLocale: 'zh-CN',
        locales: [{ code: 'zh-CN', label: '简体中文' }],
      },
      tabs: [
        { tab: { 'zh-CN': '产品', 'en-US': 'Product' }, icon: 'Boxes', pages: [{ group: 'Overview', pages: ['index', { openapi: 'api', title: { 'zh-CN': '接口', 'en-US': 'API' } }] }] },
      ],
    })).toEqual({
      title: 'Docs',
      navbar: { links: [{ label: 'GitHub', href: 'https://github.com', external: true }] },
      i18n: {
        defaultLocale: 'zh-CN',
        locales: [{ code: 'zh-CN', label: '简体中文' }],
      },
      tabs: [
        { tab: { 'zh-CN': '产品', 'en-US': 'Product' }, icon: 'Boxes', pages: [{ group: 'Overview', pages: ['index', { openapi: 'api', title: { 'zh-CN': '接口', 'en-US': 'API' } }] }] },
      ],
    })
  })

  it('rejects defaultLocale outside configured locales', () => {
    expect(() => clarifyProjectConfigSchema.parse({
      i18n: {
        defaultLocale: 'en-US',
        locales: [{ code: 'zh-CN', label: '简体中文' }],
      },
    })).toThrow('defaultLocale must be one of i18n.locales')
  })

  it('rejects duplicate locale codes', () => {
    expect(() => clarifyProjectConfigSchema.parse({
      i18n: {
        locales: [
          { code: 'zh-CN', label: '简体中文' },
          { code: 'zh-CN', label: '中文' },
        ],
      },
    })).toThrow(/Duplicate locale code/)
  })
})

describe('resolveProjectConfig', () => {
  it('uses defaults when no config provided', () => {
    const result = resolveProjectConfig()
    expect(result).toEqual({
      title: 'Clarify Docs',
      description: '',
      logo: undefined,
      favicon: undefined,
      routePrefix: '/',
      theme: { preset: 'default', primary: '#0ea5e9' },
      navbar: undefined,
      banner: undefined,
      footer: undefined,
      i18n: undefined,
      tabs: undefined,
    })
  })

  it('merges project config with defaults', () => {
    const config = {
      title: 'Project Docs',
      description: 'Desc',
      theme: { primary: '#333' },
      favicon: '/favicon.svg',
      navbar: { links: [{ label: 'GitHub', href: 'https://github.com' }] },
      banner: { content: 'v2 is out', dismissible: true },
      footer: { copyright: '© 2026' },
      i18n: {
        defaultLocale: 'zh-CN',
        locales: [
          { code: 'zh-CN', label: '简体中文' },
          { code: 'en-US', label: 'English' },
        ],
      },
      tabs: [
        { tab: 'Product', pages: [{ group: 'Getting Started', pages: ['index', 'quickstart'] }] },
      ],
    }
    const result = resolveProjectConfig(config)
    expect(result.title).toBe('Project Docs')
    expect(result.description).toBe('Desc')
    expect(result.theme).toEqual({ preset: 'default', primary: '#333' })
    expect(result.favicon).toBe('/favicon.svg')
    expect(result.navbar).toEqual({ links: [{ label: 'GitHub', href: 'https://github.com' }] })
    expect(result.banner).toEqual({ content: 'v2 is out', dismissible: true })
    expect(result.footer).toEqual({ copyright: '© 2026' })
    expect(result.i18n).toEqual({
      defaultLocale: 'zh-CN',
      missing: 'fallback',
      locales: [
        { code: 'zh-CN', label: '简体中文' },
        { code: 'en-US', label: 'English' },
      ],
    })
    expect(result.tabs).toEqual([
      { tab: 'Product', pages: [{ group: 'Getting Started', pages: ['index', 'quickstart'] }] },
    ])
  })

  it('applies theme presets before project overrides', () => {
    expect(resolveProjectConfig({ theme: { preset: 'mint' } }).theme).toEqual({
      preset: 'mint',
      primary: '#10b981',
    })
    expect(resolveProjectConfig({ theme: { preset: 'violet', primary: '#7c3aed' } }).theme).toEqual({
      preset: 'violet',
      primary: '#7c3aed',
    })
  })
})

describe('resolveBuildOptions', () => {
  it('uses defaults when no options provided', () => {
    const result = resolveBuildOptions()
    expect(result).toEqual({
      rootDirectory: 'source',
      outputDirectory: undefined,
      ssg: { failOnError: true },
    })
  })

  it('applies provided options', () => {
    const result = resolveBuildOptions({ rootDirectory: 'docs', outputDirectory: 'build' })
    expect(result).toEqual({
      rootDirectory: 'docs',
      outputDirectory: 'build',
      ssg: { failOnError: true },
    })
  })

  it('applies provided ssg options', () => {
    const result = resolveBuildOptions({ ssg: { failOnError: false } })
    expect(result).toEqual({
      rootDirectory: 'source',
      outputDirectory: undefined,
      ssg: { failOnError: false },
    })
  })
})
