import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

import type { ConfigEnv } from 'vite'

import { cliPackageVersion } from '../../cli/package.js'
import type { ClarifyProjectContext } from '../../types.js'
import { resolveProjectConfig } from '../config/config.js'
import { resolveBuildOptions, type ClarifyBuildOptions, type ResolvedBuildOptions } from '../config/options.js'
import { findClarifyConfigFile, loadClarifyConfig, type ClarifyConfig } from '../config/user-config.js'

export type ResolvedProjectContext = {
  projectRoot: string
  contentRoot: string
  config: ClarifyConfig
  configFilePath?: string
  buildOptions: ResolvedBuildOptions
  resolvedOptions: ClarifyBuildOptions
  projectContext: ClarifyProjectContext
  projectConfig: ReturnType<typeof resolveProjectConfig>
}

export async function resolveProjectContext(options: ClarifyBuildOptions = {}, env: ConfigEnv = { command: 'build', mode: 'production' }): Promise<ResolvedProjectContext> {
  const projectRoot = resolve(options.projectRoot ?? process.cwd())
  const initialBuildOptions = resolveBuildOptions(options)
  const configFilePath = findClarifyConfigFile(projectRoot)
  const config = configFilePath && existsSync(configFilePath)
    ? await loadClarifyConfig(projectRoot, env)
    : {}

  const mergedOptions: ClarifyBuildOptions = {
    ...config,
    ...options,
    projectRoot,
    rootDirectory: options.rootDirectory ?? initialBuildOptions.rootDirectory,
    outputDirectory: options.outputDirectory ?? initialBuildOptions.outputDirectory,
  }
  const resolvedProjectConfig = resolveProjectConfig(mergedOptions)
  const resolvedBuildOptions = resolveBuildOptions(mergedOptions)
  const contentRoot = join(projectRoot, resolvedBuildOptions.rootDirectory)

  const projectContext: ClarifyProjectContext = {
    projectRoot,
    contentRoot,
    version: cliPackageVersion,
    projectConfig: resolvedProjectConfig,
    generateOptions: resolvedBuildOptions,
  }

  return {
    projectRoot,
    contentRoot,
    configFilePath,
    projectConfig: resolvedProjectConfig,
    buildOptions: resolvedBuildOptions,
    resolvedOptions: mergedOptions,
    config,
    projectContext,
  }
}
