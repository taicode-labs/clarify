import { join } from 'node:path'

import type { ClarifyPlugin } from '../../types.js'

import { writeSeoFiles } from './artifacts.js'

export function createSeoPlugin(): ClarifyPlugin {
  return {
    name: 'clarify:seo',
    hooks: {
      async 'build:done'(ctx) {
        const outputDirectory = ctx.generateOptions.outputDirectory
        if (!outputDirectory) return
        await writeSeoFiles(join(ctx.generateOptions.projectRoot, outputDirectory), ctx.routes, ctx.projectConfig)
      },
    },
  }
}
