import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { loadConfigFromFile } from 'vite'
import type { ConfigEnv } from 'vite'

import type { ClarifyProjectConfig } from '../../types.js'

import { validateProjectConfig } from './index.js'
import type { ClarifyBuildOptions } from './options.js'

export type ClarifyConfig = ClarifyProjectConfig & Pick<ClarifyBuildOptions, 'plugins' | 'ssg'>

export function defineConfig(config: ClarifyConfig): ClarifyConfig {
  validateProjectConfig(config)
  return config
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
  const projectConfig = validateProjectConfig(config)
  const ssg = config.ssg && typeof config.ssg === 'object' && !Array.isArray(config.ssg)
    ? config.ssg as ClarifyConfig['ssg']
    : undefined
  return {
    ...projectConfig,
    ...(ssg ? { ssg } : {}),
  }
}

export async function loadClarifyConfig(root: string, env: ConfigEnv): Promise<ClarifyConfig> {
  const configFile = findClarifyConfigFile(root)
  if (!configFile) return {}

  if (configFile.endsWith('.json')) {
    return loadJsonConfig(configFile)
  }

  const loaded = await loadConfigFromFile(env, configFile, root, 'silent')
  const config = assertConfigObject(loaded?.config, configFile)
  return config as ClarifyConfig
}
