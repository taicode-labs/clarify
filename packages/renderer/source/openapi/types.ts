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

export type OpenApiServerVariable = {
  default?: string
  enum?: string[]
  description?: string
}

export type OpenApiServer = {
  url?: string
  description?: string
  variables?: Record<string, OpenApiServerVariable>
}

export type OpenApiSecurityScheme = {
  type?: string
  scheme?: string
  bearerFormat?: string
  in?: string
  name?: string
  flows?: unknown
  openIdConnectUrl?: string
}

export type OpenApiSecurityRequirement = Record<string, string[]>

export type RequestAuthInput = {
  name: string
  value: string
  scheme: OpenApiSecurityScheme
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
  languageKey: string
  clientKey: string
  clientTitle: string
  code: string
}
