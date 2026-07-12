import { VIRTUAL_OPENAPI, VIRTUAL_OPENAPI_SERVER } from '../../core/runtime/virtual-modules.js'
import type { OpenAPISpec } from '../../types.js'

export const openApiRegistryModuleId = VIRTUAL_OPENAPI
export const openApiServerRegistryModuleId = VIRTUAL_OPENAPI_SERVER
export const OPENAPI_SPEC_PREFIX = 'virtual:clarify/openapi-spec/'

export function specVirtualModuleId(specKey: string): string {
  return `${OPENAPI_SPEC_PREFIX}${specKey}`
}

export function generateOpenAPIRegistryModule(openApiSpecs: Record<string, string>): string {
  const entries = Object.entries(openApiSpecs)
    .map(([key, moduleId]) => `  ${JSON.stringify(key)}: () => import(${JSON.stringify(moduleId)}),`)
    .join('\n')
  return `export const openApiSpecs = {\n${entries}\n};`
}

export function generateOpenAPIServerRegistryModule(openApiSpecs: Record<string, OpenAPISpec>): string {
  return `export const openApiSpecs = ${JSON.stringify(openApiSpecs)};`
}

/** Generate a virtual module that exports a single spec as default. */
export function generateOpenAPISpecModule(spec: OpenAPISpec): string {
  return `export default ${JSON.stringify(spec)};`
}

type OpenAPIPageModuleOptions = {
  specModuleId: string
}

export function generateOpenAPIPageModule(opts: OpenAPIPageModuleOptions): string {
  return `import { createOpenApiRouteComponent } from '@clarify-labs/renderer';
import spec from ${JSON.stringify(opts.specModuleId)};

export const routeData = {};

export default createOpenApiRouteComponent({ ...routeData, spec });
`
}
