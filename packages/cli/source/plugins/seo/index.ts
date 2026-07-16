import type { ClarifyEmitAsset, ClarifyPlugin } from '../../types.js'

import { createRobotsTxt, createSitemapXml } from './artifacts.js'

export function createSeoPlugin(): ClarifyPlugin {
  return {
    name: 'clarify:seo',
    hooks: {
      'build:assets'(ctx) {
        const assets: ClarifyEmitAsset[] = []
        const sitemap = createSitemapXml(ctx.routes, ctx.projectConfig)
        const robots = createRobotsTxt(ctx.projectConfig)
        if (sitemap) assets.push({ fileName: 'sitemap.xml', source: sitemap })
        if (robots) assets.push({ fileName: 'robots.txt', source: robots })
        return assets
      },
    },
  }
}
