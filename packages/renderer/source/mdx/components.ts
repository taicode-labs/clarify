import { OpenApiDocument, OpenApiOperation } from '../openapi'

import { Markdown } from './Markdown'
import * as mdxPrimitives from './primitives'
import { Collapse } from '../components/Collapse'

const builtInMDXComponents = {
  ...mdxPrimitives,
  Markdown,
  Collapse,
}

const builtInOpenAPIComponents = {
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
