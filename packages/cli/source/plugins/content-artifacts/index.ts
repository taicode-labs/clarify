import type { ViteDevServer } from 'vite'

import type { ClarifyPlugin } from '../../types.js'

import { enrichRoutesWithRawContent, writeLlmsTxt, writeRawContentFiles } from './raw-content.js'
import { serveContentArtifacts } from './server.js'

export function createContentArtifactsPlugin(): ClarifyPlugin {
  return {
    name: 'clarify:content-artifacts',
    hooks: {
      'routes:resolved': (input) => {
        enrichRoutesWithRawContent(input.routes)
        return input
      },
      'dev:configureServer': (server: ViteDevServer, ctx) => {
        server.middlewares.use((req, res, next) => {
          if (serveContentArtifacts(req, res, ctx.projectConfig, ctx.routes)) return
          next()
        })
      },
      'build:done': (ctx) => {
        const outputDirectory = ctx.generateOptions.outputDirectory
        if (!outputDirectory) return
        writeRawContentFiles(ctx.routes, outputDirectory)
        writeLlmsTxt(ctx.routes, ctx.projectConfig, outputDirectory)
      },
    },
  }
}
