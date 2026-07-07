import { build as viteBuild } from 'vite'

import { logBuildError } from '../../core/runtime/log.js'
import { createViteConfig } from '../../core/vite-config.js'
import type { ResolvedCliOptions } from '../options.js'

export async function runBuild(options: ResolvedCliOptions): Promise<void> {
  try {
    await viteBuild(await createViteConfig(options, { command: 'build', mode: 'production' }))
  } catch (error) {
    await logBuildError(options.root, error)
    throw error
  }
}
