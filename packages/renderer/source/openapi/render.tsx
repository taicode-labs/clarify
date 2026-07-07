import type { ReactNode } from 'react'

import type { OpenAPIContentBlock } from '../content/index'

import { OpenApiOperation as OpenApiOperationComponent } from './components/OpenApiOperation'
import { OpenApiDocument } from './entry'
import { useOpenApiSpec } from './lib/spec-path'
import { getOpenApiOperation } from './lib/utils'

type OpenApiContentBlockRendererProps = {
  block: OpenAPIContentBlock
  tagFilter?: string[]
}

export function OpenApiContentBlockRenderer(arg0: OpenApiContentBlockRendererProps): ReactNode {
  const { block, tagFilter } = arg0
  const spec = useOpenApiSpec(undefined, block.spec.path)

  if (!spec) return null

  if (!block.operation) {
    return <OpenApiDocument spec={spec} specPath={block.spec.path} tagFilter={tagFilter} />
  }

  const operation = getOpenApiOperation(spec, block.operation.path, block.operation.method)
  
  if (!operation) {
    return <OpenApiDocument spec={spec} specPath={block.spec.path} tagFilter={tagFilter} />
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
