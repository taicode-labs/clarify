import SwaggerParser from '@apidevtools/swagger-parser'
import { slug } from 'github-slugger'

import type { ContentSection, OpenAPISpec } from '../../types.js'

const OPENAPI_HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const

/** Extract endpoint operations from an OpenAPI spec as page sections. */
export function extractOpenAPISections(spec: OpenAPISpec): ContentSection[] {
  const sections: ContentSection[] = []
  const paths = spec.paths ?? {}
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue
    for (const method of OPENAPI_HTTP_METHODS) {
      const op = pathItem[method]
      if (!op) continue
      const title = op.summary ?? `${method.toUpperCase()} ${path}`
      sections.push({ id: slug(`${method} ${path}`), title, level: 2, badge: method.toUpperCase() })
    }
  }
  return sections
}

export async function readOpenAPISpec(filePath: string): Promise<OpenAPISpec | null> {
  try {
    return await SwaggerParser.dereference(filePath) as OpenAPISpec
  } catch {
    return null
  }
}
