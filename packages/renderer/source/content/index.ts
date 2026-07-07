import type { ReactNode } from 'react'

export type ContentSource = {
  filePath?: string
  line?: number
  column?: number
}

export type ContentSectionMetadata = {
  id: string
  title: string
  level: number
  badge?: string
  tags?: string[]
}

export type ContentDiagnosticMetadata = {
  kind: string
  title: string
  message: string
  details?: string
  filePath?: string
}

export type ContentMetadata = {
  sections?: ContentSectionMetadata[]
  language?: string
  description?: string
  keywords?: string[]
  diagnostic?: ContentDiagnosticMetadata
}

export type MarkdownContentBlock = {
  kind: 'markdown'
  value: string
  source?: ContentSource
}

export type OpenAPISpecReference = import('../openapi/lib/utils').OpenAPISpec

export type OpenAPIOperationReference = {
  path: string
  method: string
  operationId?: string
}

export type OpenAPIContentBlock = {
  kind: 'openapi'
  spec: OpenAPISpecReference
  source?: ContentSource
  operation?: OpenAPIOperationReference
}

export type ContentBlock = MarkdownContentBlock | OpenAPIContentBlock

export type ContentRenderers = {
  markdown?: (block: MarkdownContentBlock) => ReactNode
  openapi?: (block: OpenAPIContentBlock, spec?: import('../openapi/lib/utils').OpenAPISpec) => ReactNode
}

export type ContentRenderContext = {
  renderers?: ContentRenderers
}

export type ContentDocumentRoute = {
  path: string
  title?: string
  filePath?: string
  kind?: string
  basePath?: string
  locale?: string
  isFallback?: boolean
  isBareAlias?: boolean
  alternates?: Record<string, string>
  virtualModuleId?: string
}

export type ContentDocument = {
  id: string
  title?: string
  source?: string
  content: ContentBlock[]
  metadata: ContentMetadata
  route?: ContentDocumentRoute
}
