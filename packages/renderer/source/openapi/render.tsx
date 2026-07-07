import type { ReactNode } from 'react'

import type { OpenAPIContentBlock } from '../content/index'
import type { OpenAPISpec } from '../openapi/lib/utils'

import { OpenApiOperation as OpenApiOperationComponent } from './components/OpenApiOperation'
import { OpenApiDocument } from './entry'
import { getOpenApiOperation } from './lib/utils'

type OpenApiContentBlockRendererProps = {
  block: OpenAPIContentBlock
  spec?: OpenAPISpec
  tagFilter?: string[]
}

export function OpenApiContentBlockRenderer(arg0: OpenApiContentBlockRendererProps): ReactNode {
  const { block, spec, tagFilter } = arg0

  if (!spec) return null

  if (!block.operation) {
    return <OpenApiDocument spec={spec} tagFilter={tagFilter} />
  }

  const operation = getOpenApiOperation(spec, block.operation.path, block.operation.method)

  if (!operation) {
    return <OpenApiDocument spec={spec} tagFilter={tagFilter} />
  }

  return (
    <OpenApiOperationComponent
      spec={spec}
      path={block.operation.path}
      method={block.operation.method.toUpperCase()}
      operation={operation}
    />
  )
}
