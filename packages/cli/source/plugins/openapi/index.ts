import type { ClarifyPlugin } from '../../types.js'

import { discoverOpenAPIRoutes, expandConfiguredOpenAPIRoutes } from './routes.js'
import { OpenAPIPluginState } from './state.js'

export function createOpenAPIPlugin(): ClarifyPlugin {
  const state = new OpenAPIPluginState()

  return {
    name: 'clarify:openapi',
    hooks: {
      'routes:discover': (input, ctx) => ({
        ...input,
        routes: [...input.routes, ...discoverOpenAPIRoutes(input.contentRoot, ctx.projectConfig.locales)],
      }),
      'routes:discovered': async (routes, ctx) => {
        const expandedRoutes = expandConfiguredOpenAPIRoutes(routes, ctx.projectConfig)
        return state.enrichRoutes(expandedRoutes, ctx)
      },
      'modules:before': (modules, ctx) => state.contributeModules(modules, ctx.routes),
    },
  }
}
