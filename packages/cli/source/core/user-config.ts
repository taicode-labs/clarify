import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { loadConfigFromFile } from 'vite'
import type { ConfigEnv } from 'vite'

import type { ClarifyProjectConfig } from '../types.js'

import { validateProjectConfig } from './config.js'
import type { ClarifyBuildOptions } from './options.js'

export type ClarifyConfig = ClarifyProjectConfig & Pick<ClarifyBuildOptions, 'plugins' | 'ssg'>

export function defineConfig(config: ClarifyConfig): ClarifyConfig {
  return config
}

const TS_CONFIG_FILENAMES = [
  'clarify.ts',
  'clarify.mts',
  'clarify.cts',
  'clarify.config.ts',
  'clarify.config.mts',
  'clarify.config.cts',
]

const JS_CONFIG_FILENAMES = [
  'clarify.js',
  'clarify.mjs',
  'clarify.cjs',
  'clarify.config.js',
  'clarify.config.mjs',
  'clarify.config.cjs',
]

const JSON_CONFIG_FILENAMES = [
  'clarify.json',
]

const CONFIG_FILENAMES = [
  ...TS_CONFIG_FILENAMES,
  ...JS_CONFIG_FILENAMES,
  ...JSON_CONFIG_FILENAMES,
]

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
