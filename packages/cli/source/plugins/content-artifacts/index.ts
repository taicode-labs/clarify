import type { ViteDevServer } from 'vite'

import type { ClarifyPlugin } from '../../types.js'

import { attachContentArtifactUrls } from './artifacts.js'
import { createContentArtifacts } from './provider.js'
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
        return () => {
          server.middlewares.use((req, res, next) => {
            if (serveContentArtifacts(req, res, ctx.projectConfig, ctx.routes)) return
            next()
          })
        }
      },
      'build:assets': ctx => createContentArtifacts(ctx.routes, ctx.projectConfig),
    },
  }
}
