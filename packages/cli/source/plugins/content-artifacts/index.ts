import type { ViteDevServer } from 'vite'

import type { ClarifyPlugin } from '../../types.js'

import { attachContentArtifactUrls, writeContentArtifactFiles, writeLlmsTxt } from './artifacts.js'
import { serveContentArtifacts } from './server.js'

export function createContentArtifactsPlugin(): ClarifyPlugin {
  return {
    name: 'clarify:content-artifacts',
    hooks: {
      'routes:resolved': (input) => {
        attachContentArtifactUrls(input.routes)
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
        writeContentArtifactFiles(ctx.routes, outputDirectory)
        writeLlmsTxt(ctx.routes, ctx.projectConfig, outputDirectory)
      },
    },
  }
}
