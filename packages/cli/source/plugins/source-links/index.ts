import { join } from 'node:path'

import type { ClarifyPlugin } from '../../types.js'

import { attachSourceUrls } from './source-links.js'

export function createSourceLinksPlugin(): ClarifyPlugin {
  return {
    name: 'clarify:source-links',
    hooks: {
      'routes:discovered': (routes, ctx) => {
        const contentRoot = join(ctx.generateOptions.projectRoot, ctx.generateOptions.rootDirectory)
        attachSourceUrls(routes, contentRoot, ctx.projectConfig.source)
        return routes
      },
    },
  }
}
