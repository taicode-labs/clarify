export type ContentSource = {
  filePath?: string
  line?: number
  column?: number
}

export type ContentSectionMetadata = {
  id?: string
  title: string
  level: number
}

export type ContentMetadata = {
  sections?: ContentSectionMetadata[]
  language?: string
}

export type MarkdownContentBlock = {
  kind: 'markdown'
  value: string
  source?: ContentSource
}

export type OpenAPISpecReference = {
  specFileKey?: string
  specPath?: string
}

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

export type ContentDocument = {
  id: string
  title?: string
  source?: string
  content: ContentBlock[]
  metadata: ContentMetadata
}
