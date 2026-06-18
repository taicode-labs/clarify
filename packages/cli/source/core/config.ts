import type { ZodError } from 'zod'

import type { ClarifyI18nConfig, ClarifyProjectConfig, ResolvedClarifyI18nConfig, ResolvedProjectConfig } from '../types.js'

import { clarifyProjectConfigSchema } from './config-schema.js'

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

export function resolveProjectConfig(config: ClarifyProjectConfig = {}): ResolvedProjectConfig {
  return {
    title: config.title ?? 'Clarify Docs',
    description: config.description ?? '',
    logo: config.logo,
    favicon: config.favicon,
    routePrefix: config.routePrefix ?? '/',
    theme: config.theme ?? {},
    navbar: config.navbar,
    banner: config.banner,
    footer: config.footer,
    i18n: resolveI18nConfig(config.i18n),
    tabs: config.tabs,
  }
}
