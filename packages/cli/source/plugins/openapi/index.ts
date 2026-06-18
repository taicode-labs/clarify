import type { ClarifyPlugin, OpenAPISpec } from '../../types.js'

import { extractOpenAPISections, findOpenAPIRoutes, readOpenAPISpec } from './parser.js'
import { generateOpenAPIModule, generateOpenAPIRegistryModule, openApiRegistryModuleId } from './virtual-modules.js'

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
          const spec = await readOpenAPISpec(route.filePath)
          if (!spec) {
            throw new Error(`Failed to parse OpenAPI spec: ${route.filePath}`)
          }

          specs[route.virtualModuleId] = spec
          specs[`virtual:clarify-page/${route.path.replace(/^\//, '')}`] = spec
          route.title = spec.info?.title ?? route.title
          route.sections = extractOpenAPISections(spec)
        }

        return routes
      },
      'modules:before': (modules) => {
        modules.set(openApiRegistryModuleId, generateOpenAPIRegistryModule(specs))

        for (const [moduleId, spec] of Object.entries(specs)) {
          modules.set(moduleId, generateOpenAPIModule(spec))
        }

        return modules
      },
    },
  }
}
