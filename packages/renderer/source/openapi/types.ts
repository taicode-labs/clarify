export type { OpenAPIOperation, OpenAPISpec } from './utils'

export type OpenApiRecord = Record<string, unknown>

export type OpenApiParameter = {
  name?: string
  in?: string
  required?: boolean
  description?: string
  schema?: unknown
}

export type OpenApiMediaType = {
  schema?: unknown
  example?: unknown
  examples?: Record<string, unknown>
  encoding?: Record<string, { contentType?: string }>
}

export type OpenApiResponse = {
  description?: string
  content?: Record<string, OpenApiMediaType>
}

export type MediaTypeEntry = {
  mediaType: string
  value: OpenApiMediaType
}

export type ExampleEntry = {
  key: string
  title: string
  summary?: string
  value: unknown
  generated?: boolean
}

export type RequestCodeExample = {
  key: string
  title: string
  language: string
  code: string
}
