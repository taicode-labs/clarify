import GithubSlugger from 'github-slugger'

import type { ContentBlock, ContentDocument } from '@clarify-labs/renderer'

import type { ContentRoute, OpenAPISpec } from '../../types.js'
import { createContentDocument } from '../content/content-document.js'

function createOpenAPIMetadataSections(spec: OpenAPISpec) {
  const sections: NonNullable<ContentDocument['metadata']['sections']> = []
  const paths = spec.paths ?? {}

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue

    for (const method of ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const) {
      const operation = (pathItem as Record<string, unknown>)[method]
      if (!operation || typeof operation !== 'object') continue

      const title = typeof (operation as { summary?: unknown }).summary === 'string'
        ? (operation as { summary: string }).summary
        : `${method.toUpperCase()} ${path}`

      sections.push({
        id: new GithubSlugger().slug(`${method} ${path}`),
        title,
        level: 2,
        badge: method.toUpperCase(),
        tags: Array.isArray((operation as { tags?: unknown }).tags) ? (operation as { tags: string[] }).tags : undefined,
      })
    }
  }

  return sections
}

export function createOpenAPIContentDocument(route: ContentRoute, spec: OpenAPISpec, metadata: ContentDocument['metadata'] = {}): ContentDocument {
  const blocks: ContentBlock[] = []
  blocks.push({ kind: 'openapi', spec })

  return createContentDocument(route, blocks, {
    ...metadata,
    sections: metadata.sections ?? createOpenAPIMetadataSections(spec),
  })
}
