import { OpenApiPage, ApiEndpoint, OpenApiEndpoint } from '../openapi'
import { ApiEndpointCard } from '../openapi/components/ApiEndpointCard'

import { Markdown } from './Markdown'
import * as mdxPrimitives from './primitives'

export function useMDXComponents(components: Record<string, unknown> = {}) {
  return {
    ...components,
    ...mdxPrimitives,
    Markdown,
    OpenApiPage,
    ApiEndpoint,
    OpenApiEndpoint,
    ApiEndpointCard,
  }
}
