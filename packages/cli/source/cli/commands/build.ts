import { build as viteBuild } from 'vite'

import { createClarifyEngine } from '../../core/engine/engine.js'
import { logBuildError } from '../../core/runtime/log.js'
import { createViteConfig } from '../../core/runtime/vite-config.js'
import type { ResolvedCliOptions } from '../options.js'

export async function runBuild(options: ResolvedCliOptions): Promise<void> {
  const env = { command: 'build' as const, mode: 'production' }
  const engine = createClarifyEngine({
    projectRoot: options.root,
    rootDirectory: options.content,
    outputDirectory: options.output,
  })
  try {
    await engine.prepare(env)
    await viteBuild(await createViteConfig(options, env, engine))
  } catch (error) {
    await logBuildError(options.root, error)
    throw error
  }
}
