import type { ClarifyEmitAsset, ClarifyPlugin } from '../../types.js'

import { ARD_MANIFEST_FILE_NAME, createArdManifest, createArdManifestUrl, hasArdEntries } from './manifest.js'
import { serveArdManifest } from './server.js'

const REL_ARD_LINK_PATTERN = /<link\s+[^>]*rel=["'][^"']*\bard\b[^"']*["'][^>]*>/i

export function createArdPlugin(): ClarifyPlugin {
  return {
    name: 'clarify:ard',
    hooks: {
      'build:assets'(ctx): ClarifyEmitAsset[] {
        const manifest = createArdManifest(ctx.routes, ctx.projectConfig)
        if (!manifest) return []
        return [{
          fileName: ARD_MANIFEST_FILE_NAME,
          source: `${JSON.stringify(manifest, null, 2)}\n`,
        }]
      },
      'html:transform'(input, ctx) {
        if (REL_ARD_LINK_PATTERN.test(input.html) || !hasArdEntries(ctx.routes, ctx.projectConfig)) return input

        const href = createArdManifestUrl(ctx.projectConfig)
        if (!href) return input

        return {
          ...input,
          tags: [
            ...input.tags,
            {
              tag: 'link',
              attrs: { rel: 'ard', href },
              injectTo: 'head',
            },
          ],
        }
      },
      'dev:configureServer'(server, ctx) {
        return () => {
          server.middlewares.use((req, res, next) => {
            if (serveArdManifest(req, res, ctx.projectConfig, ctx.routes)) return
            next()
          })
        }
      },
    },
  }
}
