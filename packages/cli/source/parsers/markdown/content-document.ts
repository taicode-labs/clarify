import type { ContentDocument } from '@clarify-labs/renderer'

import type { ContentRoute } from '../../types.js'
import { createContentDocument } from '../content-document.js'

export function createMarkdownContentDocument(route: Pick<ContentRoute, 'path' | 'title' | 'filePath'>, content?: string, metadata: ContentDocument['metadata'] = {}): ContentDocument | undefined {
  if (!content?.trim()) return undefined

  return createContentDocument(route, [{ kind: 'markdown', value: content }], metadata)
}
