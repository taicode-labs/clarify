import type { ContentBlock, ContentDocument } from '@clarify-labs/renderer'

import type { ContentRoute, OpenAPISpec } from '../../types.js'

export function createOpenAPIContentDocument(route: Pick<ContentRoute, 'path' | 'title' | 'filePath'>, spec: OpenAPISpec, specFileKey: string, metadata: ContentDocument['metadata'] = {}): ContentDocument {
  const blocks: ContentBlock[] = []
  const infoDescription = typeof spec.info?.description === 'string' ? spec.info.description : ''
  blocks.push({ kind: 'markdown', value: infoDescription })

  const paths = spec.paths ?? {}
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue
    for (const method of ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const) {
      const operation = (pathItem as Record<string, unknown>)[method]
      if (!operation || typeof operation !== 'object') continue
      blocks.push({
        kind: 'openapi',
        spec: { specFileKey, specPath: route.path },
        operation: { path, method },
      })
    }
  }

  return {
    id: route.path,
    title: route.title,
    source: route.filePath,
    content: blocks,
    metadata,
  }
}
