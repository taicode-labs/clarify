import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { loadConfigFromFile } from 'vite'
import type { ConfigEnv } from 'vite'

import type { ClarifyBuildOptions } from './options.js'

export type ClarifyConfig = Pick<ClarifyBuildOptions, 'plugins' | 'ssg'>

export function defineConfig(config: ClarifyConfig): ClarifyConfig {
  return config
}

const CONFIG_FILENAMES = [
  'clarify.config.ts',
  'clarify.config.mts',
  'clarify.config.cts',
  'clarify.config.js',
  'clarify.config.mjs',
  'clarify.config.cjs',
]

export function findClarifyConfigFile(root: string): string | undefined {
  for (const filename of CONFIG_FILENAMES) {
    const filePath = resolve(root, filename)
    if (existsSync(filePath)) return filePath
  }
  return undefined
}

export async function loadClarifyConfig(root: string, env: ConfigEnv): Promise<ClarifyConfig> {
  const configFile = findClarifyConfigFile(root)
  if (!configFile) return {}

  const loaded = await loadConfigFromFile(env, configFile, root, 'silent')
  const config = loaded?.config
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('[clarify] clarify.config must export a configuration object')
  }

  return config as ClarifyConfig
}
