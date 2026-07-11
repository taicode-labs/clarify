import type { ViteDevServer } from 'vite'
import { stringify as yamlStringify } from 'yaml'

import type { ClarifyEmitAsset, ClarifyPlugin } from '../../types.js'

import { attachContentArtifactUrls, createLlmsTxtArtifact, readRouteArtifactContent } from './artifacts.js'
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
      'build:assets': (ctx) => {
        const assets: ClarifyEmitAsset[] = []

        for (const route of ctx.routes) {
          const contentArtifactUrl = route.artifacts?.contentArtifactUrl
          if (!contentArtifactUrl) continue

          assets.push({
            fileName: contentArtifactUrl.replace(/^\//, ''),
            source: readRouteArtifactContent(route),
          })

          // For OpenAPI routes, also emit a YAML variant
          if (route.kind === 'openapi' && route.source.content) {
            const yamlFileName = contentArtifactUrl.replace(/\.json$/, '.yaml')
            const spec = JSON.parse(route.source.content)
            assets.push({
              fileName: yamlFileName.replace(/^\//, ''),
              source: yamlStringify(spec, { lineWidth: 0 }),
            })
          }
        }

        assets.push({
          fileName: 'llms.txt',
          source: createLlmsTxtArtifact(ctx.routes, ctx.projectConfig),
        })

        return assets
      },
    },
  }
}
