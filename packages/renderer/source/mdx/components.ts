import { OpenApiPage, ApiEndpoint, OpenApiEndpoint } from '../openapi'
import { ApiEndpointCard } from '../openapi/components/ApiEndpointCard'

import { Markdown } from './Markdown'
import * as mdxPrimitives from './primitives'

const builtInMDXComponents = {
  ...mdxPrimitives,
  Markdown,
}

const builtInOpenAPIComponents = {
  OpenApiPage,
  ApiEndpoint,
  OpenApiEndpoint,
  ApiEndpointCard,
}

export function useMDXComponents(components: Record<string, unknown> = {}) {
  return {
    ...components,
    ...builtInMDXComponents,
    ...builtInOpenAPIComponents,
  }
}
