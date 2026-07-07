import type { ContentBlock, ContentDocument } from '@clarify-labs/renderer'

import type { ContentRoute } from '../types.js'

export function createContentDocument(route: Pick<ContentRoute, 'path' | 'title' | 'filePath'>, blocks: ContentBlock[], metadata: ContentDocument['metadata'] = {}): ContentDocument {
  return {
    id: route.path,
    title: route.title,
    source: route.filePath,
    content: blocks,
    metadata,
  }
}
