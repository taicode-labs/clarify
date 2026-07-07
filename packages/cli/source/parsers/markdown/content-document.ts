import type { ContentDocument, ContentBlock } from '@clarify-labs/renderer'

import type { ContentRoute } from '../../types.js'
import { createContentDocument } from '../content/content-document.js'

function createTextContentBlock(value: string): ContentBlock {
  return { kind: 'markdown', value }
}

export function createMarkdownContentDocument(route: Pick<ContentRoute, 'path' | 'title' | 'filePath' | 'kind' | 'basePath' | 'locale' | 'isFallback' | 'isBareAlias' | 'alternates' | 'virtualModuleId'>, content?: string, metadata: ContentDocument['metadata'] = {}): ContentDocument | undefined {
  if (!content?.trim()) return undefined

  return createContentDocument(route, [createTextContentBlock(content)], metadata)
}
