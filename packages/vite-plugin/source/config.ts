import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { ClarifyGenerateOptions, ClarifyProjectConfig, ResolvedProjectConfig, ResolvedGenerateOptions } from './types.js'

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
    pages: projectConfig.pages,
  }
}

export function resolveGenerateOptions(options: ClarifyGenerateOptions = {}): ResolvedGenerateOptions {
  return {
    rootDirectory: options.rootDirectory ?? 'source/content',
    outputDirectory: options.outputDirectory,
  }
}
