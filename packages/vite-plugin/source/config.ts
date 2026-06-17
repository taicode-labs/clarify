import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { ZodError } from 'zod'

import { clarifyProjectConfigSchema } from './config-schema.js'
import type { ClarifyGenerateOptions, ClarifyI18nConfig, ClarifyProjectConfig, ResolvedClarifyI18nConfig, ResolvedProjectConfig, ResolvedGenerateOptions } from './types.js'

function formatIssuePath(path: PropertyKey[]): string {
  return path.reduce<string>((result, segment) => {
    if (typeof segment === 'number') return `${result}[${segment}]`
    const key = String(segment)
    return result ? `${result}.${key}` : key
  }, '')
}

function formatProjectConfigError(error: ZodError): string {
  const issue = error.issues[0]
  if (!issue) return '[clarify] clarify.json is invalid'

  const path = formatIssuePath(issue.path)
  if (!path) return `[clarify] clarify.json must contain a JSON object: ${issue.message}`

  return `[clarify] clarify.json field "${path}" is invalid: ${issue.message}`
}

export function validateProjectConfig(value: unknown): ClarifyProjectConfig {
  const result = clarifyProjectConfigSchema.safeParse(value)
  if (!result.success) {
    throw new Error(formatProjectConfigError(result.error))
  }
  return result.data
}

export function loadProjectConfig(root: string): ClarifyProjectConfig {
  const configPath = join(root, 'clarify.json')
  if (!existsSync(configPath)) return {}
  const content = readFileSync(configPath, 'utf-8')
  return validateProjectConfig(JSON.parse(content))
}

function resolveI18nConfig(i18n?: ClarifyI18nConfig): ResolvedClarifyI18nConfig | undefined {
  if (!i18n) return undefined

  const firstLocale = i18n.locales[0]?.code
  const sourceLocale = i18n.sourceLocale ?? i18n.defaultLocale ?? firstLocale
  if (!sourceLocale) return undefined

  return {
    sourceLocale,
    defaultLocale: i18n.defaultLocale ?? sourceLocale,
    strategy: i18n.strategy ?? 'prefix_except_default',
    missing: i18n.missing ?? 'fallback',
    locales: i18n.locales,
  }
}

export function resolveProjectConfig(root: string): ResolvedProjectConfig {
  const projectConfig = loadProjectConfig(root)
  return {
    title: projectConfig.title ?? 'Clarify Docs',
    description: projectConfig.description ?? '',
    logo: projectConfig.logo,
    favicon: projectConfig.favicon,
    routePrefix: projectConfig.routePrefix ?? '/',
    theme: projectConfig.theme ?? {},
    navbar: projectConfig.navbar,
    banner: projectConfig.banner,
    footer: projectConfig.footer,
    i18n: resolveI18nConfig(projectConfig.i18n),
    pages: projectConfig.pages,
  }
}

export function resolveGenerateOptions(options: ClarifyGenerateOptions = {}): ResolvedGenerateOptions {
  return {
    rootDirectory: options.rootDirectory ?? 'source/content',
    outputDirectory: options.outputDirectory,
    ssg: {
      failOnError: options.ssg?.failOnError ?? true,
    },
  }
}
