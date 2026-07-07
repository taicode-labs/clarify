import type { ContentDocument } from '@clarify-labs/renderer'

import { VIRTUAL_OPENAPI } from '../../core/virtual-modules.js'
import type { ContentDiagnostic, OpenAPISpec } from '../../types.js'

export const openApiRegistryModuleId = VIRTUAL_OPENAPI
export const OPENAPI_SPEC_PREFIX = 'virtual:clarify/openapi-spec/'

export function specVirtualModuleId(specKey: string): string {
  return `${OPENAPI_SPEC_PREFIX}${specKey}`
}

export function generateOpenAPIRegistryModule(openApis: Record<string, OpenAPISpec>): string {
  return `export const openApis = ${JSON.stringify(openApis)};`
}

/** Generate a virtual module that exports a single spec as default. */
export function generateOpenAPISpecModule(spec: OpenAPISpec): string {
  return `export default ${JSON.stringify(spec)};`
}

type OpenAPIPageModuleOptions = {
  spec: OpenAPISpec
  tagFilter?: string[]
  contentDocument?: ContentDocument
}

export function generateOpenAPIPageModule(opts: OpenAPIPageModuleOptions): string {
  return `import { createOpenApiRouteComponent } from '@clarify-labs/renderer';

export const routeData = ${JSON.stringify({ spec: opts.spec, tagFilter: opts.tagFilter, contentDocument: opts.contentDocument })};

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
