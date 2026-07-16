import { describe, it, expect } from 'vitest'

import { themePresets } from '../../parsers/theme.js'

import { clarifyProjectConfigSchema } from './config-schema.js'
import { resolveProjectConfig } from './config.js'
import { resolveBuildOptions } from './options.js'

describe('clarifyProjectConfigSchema', () => {
  it('validates project config', () => {
    expect(clarifyProjectConfigSchema.parse({
      title: 'Docs',
      siteUrl: 'https://docs.example.com',
      features: {
        editLink: {
          repository: 'https://github.com/acme/docs',
          branch: 'main',
          directory: 'docs/source',
        },
      },
      navigation: {
        links: [{ label: 'GitHub', href: 'https://github.com', external: true }],
        tabs: [
          { tab: { 'zh-CN': '产品', 'en-US': 'Product' }, icon: 'Boxes', pages: [{ group: 'Overview', pages: ['index', { openapi: 'api', title: { 'zh-CN': '接口', 'en-US': 'API' } }] }] },
        ],
      },
      variables: {
        product: { name: 'Clarify' },
        version: '0.8.0',
        stable: true,
        build: 8,
      },
      locales: {
        default: 'zh-CN',
        options: [{ code: 'zh-CN', label: '简体中文' }],
      },
    })).toMatchObject({
      title: 'Docs',
      siteUrl: 'https://docs.example.com',
      features: { editLink: { repository: 'https://github.com/acme/docs', branch: 'main', directory: 'docs/source' } },
      navigation: {
        links: [{ label: 'GitHub', href: 'https://github.com', external: true }],
        tabs: [
          { tab: { 'zh-CN': '产品', 'en-US': 'Product' }, icon: 'Boxes', pages: [{ group: 'Overview', pages: ['index', { openapi: 'api', title: { 'zh-CN': '接口', 'en-US': 'API' } }] }] },
        ],
      },
      variables: {
        product: { name: 'Clarify' },
        version: '0.8.0',
        stable: true,
        build: 8,
      },
      locales: {
        default: 'zh-CN',
        options: [{ code: 'zh-CN', label: '简体中文' }],
      },
      contentDir: 'source',
      base: '/',
    })
  })

  it('rejects defaultLocale outside configured locales', () => {
    expect(() => clarifyProjectConfigSchema.parse({
      locales: {
        default: 'en-US',
        options: [{ code: 'zh-CN', label: '简体中文' }],
      },
    })).toThrow('default must be one of locales.options')
  })

  it('rejects duplicate locale codes', () => {
    expect(() => clarifyProjectConfigSchema.parse({
      locales: {
        options: [
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
            primary: { light: '#047857', dark: '#34d399' },
            accent: { light: '#0f766e', dark: '#5eead4' },
            background: { light: '#f8fafc', dark: '#0a0a0b' },
            foreground: { light: '#172033', dark: '#f4f4f5' },
            surface: { light: '#ffffff', dark: '#18181b' },
            muted: { light: '#667085', dark: '#a1a1aa' },
            border: { light: 'rgb(15 23 42 / 0.11)', dark: 'rgb(255 255 255 / 0.11)' },
            codeBackground: { light: '#f1f5f3', dark: '#171719' },
          },
          radius: {
            sm: '6px',
            md: '8px',
            lg: '12px',
            xl: '16px',
          },
        },
        layout: {
          maxWidth: '82rem',
        },
      },
      navbar: undefined,
      banner: undefined,
      footer: undefined,
      variables: {},
      i18n: undefined,
      tabs: undefined,
      features: resolveProjectConfig({}).features,
    })
  })

  it('merges project config with defaults', () => {
    const config = {
      title: 'Project Docs',
      description: 'Desc',
      siteUrl: 'https://docs.example.com',
      features: { editLink: { repository: 'https://github.com/acme/docs' } },
      theme: { tokens: { colors: { primary: '#333' } } },
      homeUrl: 'https://example.com',
      favicon: '/favicon.svg',
      navigation: {
        links: [{ label: 'GitHub', href: 'https://github.com' }],
        tabs: [{ tab: 'Product', pages: [{ group: 'Getting Started', pages: ['index', 'quickstart'] }] }],
      },
      banner: { content: 'v2 is out', dismissible: true },
      footer: { copyright: '© 2026' },
      variables: {
        product: { name: 'Clarify' },
        apiVersion: '1.0.0',
      },
      locales: {
        default: 'zh-CN',
        options: [
          { code: 'zh-CN', label: '简体中文' },
          { code: 'en-US', label: 'English' },
        ],
      },
    }
    const result = resolveProjectConfig(config)
    expect(result.title).toBe('Project Docs')
    expect(result.description).toBe('Desc')
    expect(result.siteUrl).toBe('https://docs.example.com')
    expect(result.source).toEqual({ repository: 'https://github.com/acme/docs' })
    expect(result.theme.tokens.colors.primary).toBe('#333')
    expect(result.theme.layout).toEqual({ maxWidth: '82rem' })
    expect(result.features.themeEditor.enabled).toBe(true)
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
    expect(resolveProjectConfig({ base: '' }).routePrefix).toBe('/')
    expect(resolveProjectConfig({ base: '/' }).routePrefix).toBe('/')
    expect(resolveProjectConfig({ base: 'docs' }).routePrefix).toBe('/docs/')
    expect(resolveProjectConfig({ base: '/docs' }).routePrefix).toBe('/docs/')
    expect(resolveProjectConfig({ base: '/docs/' }).routePrefix).toBe('/docs/')
    expect(resolveProjectConfig({ base: ' /docs/api/ ' }).routePrefix).toBe('/docs/api/')
  })

  it('defaults assetPrefix to routePrefix and normalizes overrides', () => {
    expect(resolveProjectConfig({ base: '/docs' }).assetPrefix).toBe('/docs/')
    expect(resolveProjectConfig({ base: '/docs', assets: '' }).assetPrefix).toBe('/')
    expect(resolveProjectConfig({ assets: 'assets' }).assetPrefix).toBe('/assets/')
    expect(resolveProjectConfig({ assets: '/assets/' }).assetPrefix).toBe('/assets/')
    expect(resolveProjectConfig({ assets: './' }).assetPrefix).toBe('./')
    expect(resolveProjectConfig({ assets: './assets' }).assetPrefix).toBe('./assets/')
    expect(resolveProjectConfig({ assets: '../assets' }).assetPrefix).toBe('../assets/')
    expect(resolveProjectConfig({ assets: ' https://cdn.example.com/docs ' }).assetPrefix).toBe('https://cdn.example.com/docs/')
    expect(resolveProjectConfig({ assets: 'https://cdn.example.com/docs/' }).assetPrefix).toBe('https://cdn.example.com/docs/')
  })

  it('resolves features from booleans and detailed options', () => {
    const defaults = resolveProjectConfig().features
    expect(defaults.search).toEqual({ enabled: true, provider: 'pagefind' })
    expect(resolveProjectConfig({ features: { search: false } }).features.search).toEqual({ enabled: false, provider: 'pagefind' })
    expect(resolveProjectConfig({ features: { artifacts: { enabled: false, sitemap: false } } }).features.artifacts).toEqual({
      enabled: false,
      content: true,
      llms: true,
      sitemap: false,
      robots: true,
    })
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
    const result = resolveBuildOptions({ features: { ssg: { failOnError: false } } })
    expect(result).toEqual({
      projectRoot: process.cwd(),
      rootDirectory: 'source',
      outputDirectory: undefined,
      ssg: { failOnError: false },
    })
  })
})
