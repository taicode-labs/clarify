import { build as viteBuild } from 'vite'

import { createViteConfig } from '../../core/vite-config.js'
import type { ResolvedCliOptions } from '../options.js'

export async function runBuild(options: ResolvedCliOptions): Promise<void> {
  await viteBuild(await createViteConfig(options, { command: 'build', mode: 'production' }))
}
