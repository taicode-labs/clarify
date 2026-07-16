import { join } from 'node:path'

import type { ClarifyPlugin } from '../../types.js'

import { attachSourceEditUrls } from './source-links.js'

export function createSourceLinksPlugin(): ClarifyPlugin {
  return {
    name: 'clarify:source-links',
    hooks: {
      'routes:discovered': (routes, ctx) => {
        if (!ctx.projectConfig.features.editLink.enabled) return routes
        const contentRoot = join(ctx.generateOptions.projectRoot, ctx.generateOptions.rootDirectory)
        attachSourceEditUrls(routes, contentRoot, ctx.projectConfig.features.editLink)
        return routes
      },
    },
  }
}
