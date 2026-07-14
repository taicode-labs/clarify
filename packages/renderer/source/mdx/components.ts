import { Collapse } from '../components/Collapse'
import { Mermaid } from '../components/Mermaid'
import { ApiRequest, OpenApiDocument, OpenApiOperation } from '../openapi'

import { Markdown } from './Markdown'
import * as mdxPrimitives from './primitives'

const builtInMDXComponents = {
  ...mdxPrimitives,
  Markdown,
  Collapse,
  Mermaid,
}

const builtInOpenAPIComponents = {
  ApiRequest,
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
