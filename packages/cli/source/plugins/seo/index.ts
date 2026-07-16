import type { ClarifyEmitAsset, ClarifyPlugin } from '../../types.js'

import { createRobotsTxt, createSitemapXml } from './artifacts.js'

export function createSeoPlugin(): ClarifyPlugin {
  return {
    name: 'clarify:seo',
    hooks: {
      'build:assets'(ctx) {
        const feature = ctx.projectConfig.features.artifacts
        if (!feature.enabled) return []

        const assets: ClarifyEmitAsset[] = []
        const sitemap = feature.sitemap ? createSitemapXml(ctx.routes, ctx.projectConfig) : undefined
        const robots = feature.robots ? createRobotsTxt(ctx.projectConfig) : undefined
        if (sitemap) assets.push({ fileName: 'sitemap.xml', source: sitemap })
        if (robots) assets.push({ fileName: 'robots.txt', source: robots })
        return assets
      },
    },
  }
}
