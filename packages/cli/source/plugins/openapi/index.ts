import type { ClarifyPlugin } from '../../types.js'

import { discoverOpenAPIRoutes, expandConfiguredOpenAPIRoutes } from './routes.js'
import { OpenAPIPluginState } from './state.js'

export function createOpenAPIPlugin(): ClarifyPlugin {
  const state = new OpenAPIPluginState()

  return {
    name: 'clarify:openapi',
    hooks: {
      'routes:discover': (input, ctx) => ctx.projectConfig.features.openapi.enabled
        ? {
            ...input,
            routes: [...input.routes, ...discoverOpenAPIRoutes(input.contentRoot, ctx.projectConfig.locales)],
          }
        : input,
      'routes:discovered': async (routes, ctx) => {
        if (!ctx.projectConfig.features.openapi.enabled) {
          return state.enrichRoutes(routes.filter(route => route.kind !== 'openapi'), ctx)
        }
        const expandedRoutes = expandConfiguredOpenAPIRoutes(routes, ctx.projectConfig)
        return state.enrichRoutes(expandedRoutes, ctx)
      },
      'modules:before': (modules, ctx) => state.contributeModules(
        modules,
        ctx.projectConfig.features.openapi.enabled ? ctx.routes : ctx.routes.filter(route => route.kind !== 'openapi'),
      ),
    },
  }
}
