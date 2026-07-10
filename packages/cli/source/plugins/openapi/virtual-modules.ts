import { VIRTUAL_OPENAPI, VIRTUAL_OPENAPI_SERVER } from '../../core/runtime/virtual-modules.js'
import type { ContentDiagnostic, OpenAPISpec } from '../../types.js'

export const openApiRegistryModuleId = VIRTUAL_OPENAPI
export const openApiServerRegistryModuleId = VIRTUAL_OPENAPI_SERVER
export const OPENAPI_SPEC_PREFIX = 'virtual:clarify/openapi-spec/'

export function specVirtualModuleId(specKey: string): string {
  return `${OPENAPI_SPEC_PREFIX}${specKey}`
}

export function generateOpenAPIRegistryModule(openApis: Record<string, string>): string {
  const entries = Object.entries(openApis)
    .map(([key, moduleId]) => `  ${JSON.stringify(key)}: () => import(${JSON.stringify(moduleId)}),`)
    .join('\n')
  return `export const openApis = {\n${entries}\n};`
}

export function generateOpenAPIServerRegistryModule(openApis: Record<string, OpenAPISpec>): string {
  return `export const openApis = ${JSON.stringify(openApis)};`
}

/** Generate a virtual module that exports a single spec as default. */
export function generateOpenAPISpecModule(spec: OpenAPISpec): string {
  return `export default ${JSON.stringify(spec)};`
}

type OpenAPIPageModuleOptions = {
  specPath: string
  tagFilter?: string[]
}

export function generateOpenAPIPageModule(opts: OpenAPIPageModuleOptions): string {
  return `import { createOpenApiRouteComponent } from '@clarify-labs/renderer';

export const routeData = ${JSON.stringify({ specPath: opts.specPath, tagFilter: opts.tagFilter })};

export default createOpenApiRouteComponent(routeData);
`
}

export function generateOpenAPIErrorModule(diagnostic: ContentDiagnostic): string {
  return `import { createContentDiagnosticComponent } from '@clarify-labs/renderer';

export const contentDiagnostic = ${JSON.stringify({
    kind: diagnostic.kind ?? 'openapi',
    title: diagnostic.title,
    message: diagnostic.message,
    filePath: diagnostic.filePath,
    details: diagnostic.details,
  })};

export default createContentDiagnosticComponent(contentDiagnostic);
`
}
