import type { ZodError } from 'zod'

import { resolveThemeConfig } from '../../parsers/theme.js'
import type { ClarifyFeaturesConfig, ClarifyLocalesConfig, ClarifyProjectConfig, ResolvedClarifyFeaturesConfig, ResolvedClarifyI18nConfig, ResolvedProjectConfig } from '../../types.js'

import { clarifyFeaturesConfigSchema, clarifyProjectConfigSchema } from './config-schema.js'

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

function resolveLocalesConfig(locales?: ClarifyLocalesConfig): ResolvedClarifyI18nConfig | undefined {
  if (!locales) return undefined

  const firstLocale = locales.options[0]?.code
  const defaultLocale = locales.default ?? firstLocale
  if (!defaultLocale) return undefined

  return {
    defaultLocale,
    missing: locales.missing ?? 'fallback',
    locales: locales.options,
  }
}

export function resolveFeaturesConfig(features: ClarifyFeaturesConfig = {}): ResolvedClarifyFeaturesConfig {
  return clarifyFeaturesConfigSchema.parse(features) as unknown as ResolvedClarifyFeaturesConfig
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
  const routePrefix = resolveRoutePrefix(config.base)

  return {
    title: config.title ?? 'Clarify Docs',
    description: config.description ?? '',
    siteUrl: config.siteUrl,
    source: config.features?.editLink && typeof config.features.editLink !== 'boolean' && config.features.editLink.repository
      ? { repository: config.features.editLink.repository, branch: config.features.editLink.branch, directory: config.features.editLink.directory }
      : undefined,
    logo: config.logo,
    homeUrl: config.homeUrl,
    favicon: config.favicon,
    routePrefix,
    assetPrefix: resolveAssetPrefix(config.assets, routePrefix),
    theme: resolveThemeConfig(config.theme),
    navbar: config.navigation?.links ? { links: config.navigation.links } : undefined,
    banner: config.banner,
    footer: config.footer,
    variables: config.variables ?? {},
    i18n: resolveLocalesConfig(config.locales),
    tabs: config.navigation?.tabs,
    features: resolveFeaturesConfig(config.features),
  }
}
