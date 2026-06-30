import type { ClarifyContentKind, ClarifyContentTransformInput } from '../types.js'

import { parseFrontmatter } from './frontmatter.js'

export type ProcessedMdxContent = {
  frontmatter: Record<string, unknown>
  content: string
}

export type ContentTransform = (input: ClarifyContentTransformInput) => Promise<ClarifyContentTransformInput> | ClarifyContentTransformInput

export type ContentProcessor = {
  processMdx(source: string, filePath?: string): Promise<ProcessedMdxContent>
  processText(source: string, kind: Exclude<ClarifyContentKind, 'mdx'>, filePath?: string): Promise<string>
}

async function transformContent(transform: ContentTransform | undefined, input: ClarifyContentTransformInput): Promise<ClarifyContentTransformInput> {
  return transform ? await transform(input) : input
}

export function createContentProcessor(transform?: ContentTransform): ContentProcessor {
  return {
    async processMdx(source, filePath) {
      const { frontmatter, content } = parseFrontmatter(source)
      const transformed = await transformContent(transform, {
        kind: 'mdx',
        source,
        filePath,
        frontmatter,
        content,
      })

      return {
        frontmatter: transformed.frontmatter,
        content: transformed.content,
      }
    },
    async processText(source, kind, filePath) {
      const transformed = await transformContent(transform, {
        kind,
        source,
        filePath,
        frontmatter: {},
        content: source,
      })
      return transformed.content
    },
  }
}
