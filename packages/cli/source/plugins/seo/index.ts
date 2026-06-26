import type { ClarifyEmitAsset, ClarifyPlugin } from '../../types.js'

import { createRobotsTxt, createSitemapXml } from './artifacts.js'

export function createSeoPlugin(): ClarifyPlugin {
  return {
    name: 'clarify:seo',
    hooks: {
      'build:assets'(ctx) {
        const sitemap = createSitemapXml(ctx.routes, ctx.projectConfig)
        const robots = createRobotsTxt(ctx.projectConfig)
        if (!sitemap || !robots) return []

        const assets: ClarifyEmitAsset[] = [
          { fileName: 'sitemap.xml', source: sitemap },
          { fileName: 'robots.txt', source: robots },
        ]
        return assets
      },
    },
  }
}
