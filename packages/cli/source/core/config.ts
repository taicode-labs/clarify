import type { ZodError } from 'zod'

import type { ClarifyI18nConfig, ClarifyProjectConfig, ResolvedClarifyI18nConfig, ResolvedProjectConfig } from '../types.js'

import { clarifyProjectConfigSchema } from './config-schema.js'
import { resolveThemeConfig } from './theme.js'

function formatIssuePath(path: PropertyKey[]): string {
  return path.reduce<string>((result, segment) => {
    if (typeof segment === 'number') return `${result}[${segment}]`
    const key = String(segment)
    return result ? `${result}.${key}` : key
  }, '')
}

function formatProjectConfigError(error: ZodError): string {
  const issue = error.issues[0]
  if (!issue) return '[clarify] config is invalid'

  const path = formatIssuePath(issue.path)
  if (!path) return `[clarify] config must contain an object: ${issue.message}`

  return `[clarify] config field "${path}" is invalid: ${issue.message}`
}

export function validateProjectConfig(value: unknown): ClarifyProjectConfig {
  const result = clarifyProjectConfigSchema.safeParse(value)
  if (!result.success) {
    throw new Error(formatProjectConfigError(result.error))
  }
  return result.data
}

function resolveI18nConfig(i18n?: ClarifyI18nConfig): ResolvedClarifyI18nConfig | undefined {
  if (!i18n) return undefined

  const firstLocale = i18n.locales[0]?.code
  const defaultLocale = i18n.defaultLocale ?? firstLocale
  if (!defaultLocale) return undefined

  return {
    defaultLocale,
    missing: i18n.missing ?? 'fallback',
    locales: i18n.locales,
  }
}

function resolveRoutePrefix(routePrefix?: string): string {
  const trimmed = routePrefix?.trim()
  if (!trimmed || trimmed === '/') return '/'

  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`
}

function resolveAssetPrefix(assetPrefix: string | undefined, routePrefix: string): string {
  const trimmed = assetPrefix?.trim()
  if (trimmed === undefined) return routePrefix
  if (trimmed === './' || trimmed === '') return trimmed || '/'
  if (!trimmed || trimmed === '/') return '/'
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)) return trimmed.endsWith('/') ? trimmed : `${trimmed}/`
  if (trimmed.startsWith('./') || trimmed.startsWith('../')) return trimmed.endsWith('/') ? trimmed : `${trimmed}/`

  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`
}

export function resolveProjectConfig(config: ClarifyProjectConfig = {}): ResolvedProjectConfig {
  const routePrefix = resolveRoutePrefix(config.routePrefix)

  return {
    title: config.title ?? 'Clarify Docs',
    description: config.description ?? '',
    siteUrl: config.siteUrl,
    source: config.source,
    logo: config.logo,
    homeUrl: config.homeUrl,
    favicon: config.favicon,
    routePrefix,
    assetPrefix: resolveAssetPrefix(config.assetPrefix, routePrefix),
    theme: resolveThemeConfig(config.theme),
    navbar: config.navbar,
    banner: config.banner,
    footer: config.footer,
    i18n: resolveI18nConfig(config.i18n),
    tabs: config.tabs,
  }
}
