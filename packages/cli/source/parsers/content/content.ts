import type { ClarifyContentKind, ClarifyContentTransformInput, ClarifyHookContext, ClarifyPlugin } from '../../types.js'
import { runHooks } from '../../core/plugin/hooks.js'
import { parseFrontmatter } from '../markdown/frontmatter.js'

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

/**
 * Creates a ContentProcessor that forwards each piece of content through the
 * `content:transform` pipeline hook before it is parsed.
 *
 * Plugins that need to read content (site-discovery, openapi) call this with
 * the plugins list from their hook context. There is no global registry -
 * each call produces an independent processor bound to the given plugins.
 */
export function createProjectContentProcessor(plugins: ClarifyPlugin[], ctx: ClarifyHookContext): ContentProcessor {
  return createContentProcessor(input => runHooks(plugins, 'content:transform', input, ctx))
}
