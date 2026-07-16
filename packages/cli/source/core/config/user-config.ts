import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { loadConfigFromFile } from 'vite'
import type { ConfigEnv } from 'vite'

import type { ClarifyProjectConfig } from '../../types.js'

import { validateProjectConfig } from './config.js'
import type { ClarifyPlugin } from '../../types.js'

export type ClarifyConfig = ClarifyProjectConfig & {
  plugins?: ClarifyPlugin[]
}

export function defineConfig(config: ClarifyConfig): ClarifyConfig {
  return validateClarifyConfig(config)
}

/**
 * Config filenames Clarify CLI looks for at the project root, in resolution
 * order. Exported so other modules (e.g. the dev `project-info` endpoint) can
 * surface the same list to tooling without duplicating it.
 */
export const CONFIG_FILENAMES = [
  'clarify.ts',
  'clarify.js',
  'clarify.json',
] as const

export function findClarifyConfigFile(root: string): string | undefined {
  for (const filename of CONFIG_FILENAMES) {
    const filePath = resolve(root, filename)
    if (existsSync(filePath)) return filePath
  }
  return undefined
}

function assertConfigObject(config: unknown, configFile: string): Record<string, unknown> {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error(`[clarify] ${configFile} must export a configuration object`)
  }
  return config as Record<string, unknown>
}

function loadJsonConfig(configFile: string): ClarifyConfig {
  const config = assertConfigObject(JSON.parse(readFileSync(configFile, 'utf-8')), configFile)
  if ('plugins' in config) {
    throw new Error('[clarify] clarify.json does not support plugins; use clarify.ts or clarify.js')
  }
  return validateClarifyConfig(config)
}

function validateClarifyConfig(config: ClarifyConfig | Record<string, unknown>): ClarifyConfig {
  const { plugins, ...projectConfigInput } = config
  if (plugins !== undefined && !Array.isArray(plugins)) {
    throw new Error('[clarify] config field "plugins" is invalid: Expected an array')
  }
  const projectConfig = validateProjectConfig(projectConfigInput)
  return plugins ? { ...projectConfig, plugins } : projectConfig
}

export async function loadClarifyConfig(root: string, env: ConfigEnv): Promise<ClarifyConfig> {
  const configFile = findClarifyConfigFile(root)
  if (!configFile) return {}

  if (configFile.endsWith('.json')) {
    return loadJsonConfig(configFile)
  }

  const loaded = await loadConfigFromFile(env, configFile, root, 'silent')
  const config = assertConfigObject(loaded?.config, configFile)
  return validateClarifyConfig(config)
}
