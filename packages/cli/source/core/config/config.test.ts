import { describe, it, expect } from 'vitest'

import { themePresets } from '../site/theme.js'

import { clarifyProjectConfigSchema } from './config-schema.js'
import { resolveProjectConfig } from './config.js'
import { resolveBuildOptions } from './options.js'

describe('clarifyProjectConfigSchema', () => {
  it('validates project config', () => {
    expect(clarifyProjectConfigSchema.parse({
      title: 'Docs',
      siteUrl: 'https://docs.example.com',
      source: { repository: 'https://github.com/acme/docs', branch: 'main', directory: 'docs/source' },
      navbar: { links: [{ label: 'GitHub', href: 'https://github.com', external: true }] },
      variables: {
        product: { name: 'Clarify' },
        version: '0.8.0',
        stable: true,
        build: 8,
      },
      i18n: {
        defaultLocale: 'zh-CN',
        locales: [{ code: 'zh-CN', label: '简体中文' }],
      },
      tabs: [
        { tab: { 'zh-CN': '产品', 'en-US': 'Product' }, icon: 'Boxes', pages: [{ group: 'Overview', pages: ['index', { openapi: 'api', title: { 'zh-CN': '接口', 'en-US': 'API' } }] }] },
      ],
    })).toEqual({
      title: 'Docs',
      siteUrl: 'https://docs.example.com',
      source: { repository: 'https://github.com/acme/docs', branch: 'main', directory: 'docs/source' },
      navbar: { links: [{ label: 'GitHub', href: 'https://github.com', external: true }] },
      variables: {
        product: { name: 'Clarify' },
        version: '0.8.0',
        stable: true,
        build: 8,
      },
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
      siteUrl: undefined,
      source: undefined,
      logo: undefined,
      homeUrl: undefined,
      favicon: undefined,
      routePrefix: '/',
      assetPrefix: '/',
      theme: {
        preset: 'default',
        tokens: {
          colors: {
            primary: '#047857',
            accent: '#0D9488',
            background: { light: '#ffffff', dark: '#09090b' },
            foreground: { light: '#111827', dark: '#ffffff' },
            surface: { light: '#ffffff', dark: '#18181b' },
            muted: { light: '#64748b', dark: '#a1a1aa' },
            border: { light: 'rgb(15 23 42 / 0.12)', dark: 'rgb(255 255 255 / 0.1)' },
            codeBackground: { light: '#f6fbf8', dark: '#18181b' },
          },
          radius: {
            sm: '6px',
            md: '10px',
            lg: '14px',
            xl: '18px',
          },
        },
        layout: {
          maxWidth: '82rem',
        },
        editor: false,
      },
      navbar: undefined,
      banner: undefined,
      footer: undefined,
      variables: {},
      i18n: undefined,
      tabs: undefined,
    })
  })

  it('merges project config with defaults', () => {
    const config = {
      title: 'Project Docs',
      description: 'Desc',
      siteUrl: 'https://docs.example.com',
      source: { repository: 'https://github.com/acme/docs' },
      theme: { tokens: { colors: { primary: '#333' } }, editor: true },
      homeUrl: 'https://example.com',
      favicon: '/favicon.svg',
      navbar: { links: [{ label: 'GitHub', href: 'https://github.com' }] },
      banner: { content: 'v2 is out', dismissible: true },
      footer: { copyright: '© 2026' },
      variables: {
        product: { name: 'Clarify' },
        apiVersion: '1.0.0',
      },
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
    expect(result.siteUrl).toBe('https://docs.example.com')
    expect(result.source).toEqual({ repository: 'https://github.com/acme/docs' })
    expect(result.theme.tokens.colors.primary).toBe('#333')
    expect(result.theme.layout).toEqual({ maxWidth: '82rem' })
    expect(result.theme.editor).toBe(true)
    expect(result.homeUrl).toBe('https://example.com')
    expect(result.favicon).toBe('/favicon.svg')
    expect(result.assetPrefix).toBe('/')
    expect(result.navbar).toEqual({ links: [{ label: 'GitHub', href: 'https://github.com' }] })
    expect(result.banner).toEqual({ content: 'v2 is out', dismissible: true })
    expect(result.footer).toEqual({ copyright: '© 2026' })
    expect(result.variables).toEqual({
      product: { name: 'Clarify' },
      apiVersion: '1.0.0',
    })
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

  it('normalizes routePrefix for Vite base paths', () => {
    expect(resolveProjectConfig({ routePrefix: '' }).routePrefix).toBe('/')
    expect(resolveProjectConfig({ routePrefix: '/' }).routePrefix).toBe('/')
    expect(resolveProjectConfig({ routePrefix: 'docs' }).routePrefix).toBe('/docs/')
    expect(resolveProjectConfig({ routePrefix: '/docs' }).routePrefix).toBe('/docs/')
    expect(resolveProjectConfig({ routePrefix: '/docs/' }).routePrefix).toBe('/docs/')
    expect(resolveProjectConfig({ routePrefix: ' /docs/api/ ' }).routePrefix).toBe('/docs/api/')
  })

  it('defaults assetPrefix to routePrefix and normalizes overrides', () => {
    expect(resolveProjectConfig({ routePrefix: '/docs' }).assetPrefix).toBe('/docs/')
    expect(resolveProjectConfig({ routePrefix: '/docs', assetPrefix: '' }).assetPrefix).toBe('/')
    expect(resolveProjectConfig({ assetPrefix: 'assets' }).assetPrefix).toBe('/assets/')
    expect(resolveProjectConfig({ assetPrefix: '/assets/' }).assetPrefix).toBe('/assets/')
    expect(resolveProjectConfig({ assetPrefix: './' }).assetPrefix).toBe('./')
    expect(resolveProjectConfig({ assetPrefix: './assets' }).assetPrefix).toBe('./assets/')
    expect(resolveProjectConfig({ assetPrefix: '../assets' }).assetPrefix).toBe('../assets/')
    expect(resolveProjectConfig({ assetPrefix: ' https://cdn.example.com/docs ' }).assetPrefix).toBe('https://cdn.example.com/docs/')
    expect(resolveProjectConfig({ assetPrefix: 'https://cdn.example.com/docs/' }).assetPrefix).toBe('https://cdn.example.com/docs/')
  })

  it('applies theme presets before project overrides', () => {
    const baseTheme = resolveProjectConfig({ theme: { preset: 'base' } }).theme
    expect(baseTheme.preset).toBe('base')
    expect(baseTheme.tokens.colors.primary).toBe('#18181b')
    expect(baseTheme.tokens.colors.accent).toBe('#52525b')
    expect(baseTheme.layout).toEqual({ maxWidth: '80rem' })

    const customizedBaseTheme = resolveProjectConfig({
      theme: {
        preset: 'base',
        tokens: { colors: { primary: '#333' } },
        layout: {},
      },
    }).theme
    expect(customizedBaseTheme.preset).toBe('base')
    expect(customizedBaseTheme.tokens.colors.primary).toBe('#333')
    expect(customizedBaseTheme.tokens.colors.accent).toBe('#52525b')
    expect(customizedBaseTheme.layout).toEqual({ maxWidth: '80rem' })
  })

  it('accepts theme color tokens with light and dark values', () => {
    expect(clarifyProjectConfigSchema.parse({
      theme: {
        tokens: {
          colors: {
            muted: { light: '#64748b', dark: '#a1a1aa' },
          },
        },
      },
    }).theme?.tokens?.colors?.muted).toEqual({ light: '#64748b', dark: '#a1a1aa' })

    const result = resolveProjectConfig({
      theme: {
        tokens: {
          colors: {
            primary: { light: '#2563eb', dark: '#60a5fa' },
            muted: { light: '#64748b', dark: '#a1a1aa' },
          },
        },
      },
    })

    expect(result.theme.tokens.colors.primary).toEqual({ light: '#2563eb', dark: '#60a5fa' })
    expect(result.theme.tokens.colors.muted).toEqual({ light: '#64748b', dark: '#a1a1aa' })
  })

  it('defines every built-in theme token and layout value', () => {
    const requiredColorTokens = ['primary', 'accent', 'background', 'foreground', 'surface', 'muted', 'border', 'codeBackground'] as const
    const requiredRadiusTokens = ['sm', 'md', 'lg', 'xl'] as const
    const requiredLayoutValues = ['maxWidth'] as const

    for (const theme of Object.values(themePresets)) {
      for (const token of requiredColorTokens) {
        expect(theme.tokens.colors[token]).toBeTruthy()
      }
      for (const token of requiredRadiusTokens) {
        expect(theme.tokens.radius[token]).toBeTruthy()
      }
      for (const value of requiredLayoutValues) {
        expect(theme.layout[value]).toBeTruthy()
      }
    }
  })
})

describe('resolveBuildOptions', () => {
  it('uses defaults when no options provided', () => {
    const result = resolveBuildOptions()
    expect(result).toEqual({
      projectRoot: process.cwd(),
      rootDirectory: 'source',
      outputDirectory: undefined,
      ssg: { failOnError: true },
    })
  })

  it('applies provided options', () => {
    const result = resolveBuildOptions({ rootDirectory: 'docs', outputDirectory: 'build' })
    expect(result).toEqual({
      projectRoot: process.cwd(),
      rootDirectory: 'docs',
      outputDirectory: 'build',
      ssg: { failOnError: true },
    })
  })

  it('applies provided ssg options', () => {
    const result = resolveBuildOptions({ ssg: { failOnError: false } })
    expect(result).toEqual({
      projectRoot: process.cwd(),
      rootDirectory: 'source',
      outputDirectory: undefined,
      ssg: { failOnError: false },
    })
  })
})
