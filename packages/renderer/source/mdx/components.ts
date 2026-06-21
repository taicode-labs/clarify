import { OpenApiPage, ApiEndpoint, OpenApiEndpoint } from '../openapi'
import { ApiEndpointCard } from '../openapi/components/ApiEndpointCard'

import { DocShell } from './DocShell'
import * as mdxPrimitives from './primitives'

export function useMDXComponents(components: Record<string, unknown> = {}) {
  return {
    ...components,
    ...mdxPrimitives,
    OpenApiPage,
    ApiEndpoint,
    OpenApiEndpoint,
    ApiEndpointCard,
    DocShell,
  }
}
