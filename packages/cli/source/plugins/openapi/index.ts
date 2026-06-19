import type { ClarifyPlugin, OpenAPISpec } from '../../types.js'

import { extractOpenAPISections, findOpenAPIRoutes, readOpenAPISpec } from './parser.js'
import { generateOpenAPIErrorModule, generateOpenAPIModule, generateOpenAPIRegistryModule, openApiRegistryModuleId } from './virtual-modules.js'

export function createOpenAPIPlugin(): ClarifyPlugin {
  const specs: Record<string, OpenAPISpec> = {}

  return {
    name: 'clarify:openapi',
    hooks: {
      'routes:discover': (input) => ({
        ...input,
        routes: [...input.routes, ...findOpenAPIRoutes(input.contentRoot)],
      }),
      'routes:discovered': async (routes) => {
        for (const key of Object.keys(specs)) delete specs[key]

        for (const route of routes.filter(route => route.kind === 'openapi')) {
          const result = await readOpenAPISpec(route.filePath)
          if (!result.ok) {
            route.diagnostic = result.diagnostic
            route.title = route.title || 'OpenAPI parse error'
            route.sections = []
            continue
          }

          const spec = result.spec
          specs[route.virtualModuleId] = spec
          specs[`virtual:clarify-page/${route.path.replace(/^\//, '')}`] = spec
          route.title = spec.info?.title ?? route.title
          route.description = spec.info?.description ?? route.description
          route.sections = extractOpenAPISections(spec)
        }

        return routes
      },
      'modules:before': (modules, ctx) => {
        modules.set(openApiRegistryModuleId, generateOpenAPIRegistryModule(specs))

        for (const [moduleId, spec] of Object.entries(specs)) {
          modules.set(moduleId, generateOpenAPIModule(spec))
        }

        for (const route of ctx.routes.filter(route => route.kind === 'openapi' && route.diagnostic)) {
          if (route.diagnostic) modules.set(route.virtualModuleId, generateOpenAPIErrorModule(route.diagnostic))
        }

        return modules
      },
    },
  }
}
