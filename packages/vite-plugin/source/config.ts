import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { ClarifyPluginOptions, ClarifyProjectConfig, ResolvedClarifyOptions } from './types.js'

export function loadProjectConfig(root: string): ClarifyProjectConfig {
  const configPath = join(root, 'clarify.json')
  if (!existsSync(configPath)) return {}
  try {
    const content = readFileSync(configPath, 'utf-8')
    return JSON.parse(content) as ClarifyProjectConfig
  } catch {
    return {}
  }
}

export function resolveOptions(root: string, pluginOptions: ClarifyPluginOptions = {}): ResolvedClarifyOptions {
  const projectConfig = loadProjectConfig(root)
  return {
    title: projectConfig.title ?? 'Clarify Docs',
    description: projectConfig.description ?? '',
    logo: projectConfig.logo,
    favicon: projectConfig.favicon,
    routeBase: pluginOptions.routeBase ?? projectConfig.routeBase ?? '/',
    theme: projectConfig.theme ?? {},
    documentationRoot: pluginOptions.docsRoot ?? 'source/content',
    outputDirectory: pluginOptions.outPath ?? 'output',
    navbar: projectConfig.navbar,
    banner: projectConfig.banner,
    footer: projectConfig.footer,
    navigation: projectConfig.navigation,
    redirects: projectConfig.redirects,
  }
}
