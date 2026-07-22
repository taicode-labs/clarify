import { Collapse } from '../components/Collapse'
import { Mermaid } from '../components/Mermaid'
import { OpenApiRequest, OpenApiDocument, OpenApiLink, OpenApiOperation } from '../openapi'

import * as mdxPrimitives from './primitives'

const builtInMDXComponents = {
  ...mdxPrimitives,
  Collapse,
  Mermaid,
}

const builtInOpenAPIComponents = {
  OpenApiLink,
  OpenApiRequest,
  OpenApiDocument,
  OpenApiOperation,
}

export function useMDXComponents(components: Record<string, unknown> = {}) {
  return {
    ...components,
    ...builtInMDXComponents,
    ...builtInOpenAPIComponents,
  }
}
