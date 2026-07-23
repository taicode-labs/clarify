import type { ZodError } from 'zod'

import { resolveThemeConfig } from '../../parsers/theme.js'
import type { ClarifyFeaturesConfig, ClarifyLocalesConfig, ClarifyProjectConfig, ResolvedClarifyFeaturesConfig, ResolvedClarifyLocalesConfig, ResolvedProjectConfig } from '../../types.js'

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

function resolveLocalesConfig(locales?: ClarifyLocalesConfig): ResolvedClarifyLocalesConfig | undefined {
  if (!locales) return undefined

  const firstLocale = locales.locales[0]?.code
  const defaultLocale = locales.default ?? firstLocale
  if (!defaultLocale) return undefined

  return {
    default: defaultLocale,
    missing: locales.missing ?? 'fallback',
    locales: locales.locales,
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
  const routePrefix = resolveRoutePrefix(config.routePrefix)

  return {
    title: config.title ?? 'Clarify Docs',
    description: config.description ?? '',
    siteUrl: config.siteUrl,
    routePrefix,
    assetPrefix: resolveAssetPrefix(config.assetPrefix, routePrefix),
    logo: config.logo,
    homeUrl: config.homeUrl,
    favicon: config.favicon,
    theme: resolveThemeConfig(config.theme),
    layout: {
      tabs: config.layout?.tabs ?? 'subnav',
    },
    navigation: config.navigation,
    banner: config.banner,
    footer: config.footer,
    locales: resolveLocalesConfig(config.locales),
    variables: config.variables ?? {},
    features: resolveFeaturesConfig(config.features),
  }
}
