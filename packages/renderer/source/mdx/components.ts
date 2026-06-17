import { ApiEndpointCard, DocShell } from '../components'
import { OpenApiPage, ApiEndpoint, OpenApiEndpoint } from '../openapi'
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
