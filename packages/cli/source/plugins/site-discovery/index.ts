import { findContentRoutes, findLocalizedContentRoutes } from '../../parsers/routes/routes.js'
import { createProjectContentProcessor } from '../../parsers/content/content.js'
import type { ClarifyPlugin } from '../../types.js'

/**
 * Site discovery plugin: scans the content directory and produces the initial
 * set of content routes. Handles single-locale and i18n (localized) discovery,
 * including fallback routes and bare aliases for the default locale.
 *
 * Registers the `routes:discover` pipeline hook so plugins running later in
 * the pipeline can augment or filter the discovered routes.
 */
export function createSiteDiscoveryPlugin(): ClarifyPlugin {
  return {
    name: 'clarify:site-discovery',
    enforce: 'pre',
    hooks: {
      'routes:discover': async (input, ctx) => {
        const processor = createProjectContentProcessor(ctx.plugins, ctx)
        const options = {
          contentProcessor: processor,
        }

        const routes = ctx.projectConfig.i18n
          ? await findLocalizedContentRoutes(input.contentRoot, ctx.projectConfig.i18n, options)
          : await findContentRoutes(input.contentRoot, input.contentRoot, options)

        return {
          ...input,
          routes,
        }
      },
    },
  }
}
