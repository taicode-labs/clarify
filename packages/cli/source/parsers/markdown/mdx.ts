import { compile, type CompileOptions } from '@mdx-js/mdx'
import rehypeShiki from '@shikijs/rehype'
import rehypeSlug from 'rehype-slug'
import { createCssVariablesTheme } from 'shiki'
import { visit } from 'unist-util-visit'

import { markdownRemarkPlugins, parseCodeMeta } from '@clarify-labs/renderer'

import type { ContentDiagnostic } from '../../types.js'
import { createContentDiagnostic } from '../content/diagnostic.js'

type HastNode = {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

type HastParent = HastNode & {
  children: HastNode[]
}

function getLanguage(className: unknown): string {
  const classes = Array.isArray(className) ? className : typeof className === 'string' ? className.split(/\s+/) : []
  const languageClass = classes.find((item): item is string => typeof item === 'string' && item.startsWith('language-'))
  return languageClass?.replace(/^language-/, '') || 'txt'
}

const cssVariablesTheme = createCssVariablesTheme()

export function rehypeParseCodeBlocks() {
  return (tree: HastNode) => {
    visit(tree, 'element', (node: HastNode, _nodeIndex: number | undefined, parentNode: HastParent | undefined) => {
      if (node.tagName !== 'code' || !parentNode) return
      parentNode.properties = parentNode.properties ?? {}
      node.properties = node.properties ?? {}
      const language = getLanguage(node.properties.className)
      parentNode.properties.language = language
      node.properties.language = language

      for (const key of ['title', 'tag', 'label']) {
        if (node.properties[key] !== undefined) parentNode.properties[key] = node.properties[key]
      }
    })
  }
}

export const remarkPlugins: unknown[] = markdownRemarkPlugins
export const rehypePlugins: NonNullable<CompileOptions['rehypePlugins']> = [
  rehypeSlug,
  rehypeParseCodeBlocks,
  [rehypeShiki, {
    theme: cssVariablesTheme,
    langs: [],
    lazy: true,
    addLanguageClass: true,
    fallbackLanguage: 'text',
    parseMetaString: parseCodeMeta,
  }],
]

type ContentCompileDiagnosticOptions = {
  format: 'markdown' | 'mdx'
  phase: 'syntax' | 'compilation'
  error: unknown
  filePath?: string
  projectRoot?: string
}

export function createContentCompileDiagnostic(options: ContentCompileDiagnosticOptions): ContentDiagnostic {
  const { format, phase, error, filePath, projectRoot } = options
  const label = format === 'mdx' ? 'MDX' : 'Markdown'
  return createContentDiagnostic({
    kind: format,
    title: `${label} ${phase} error`,
    message: phase === 'syntax'
      ? `This page could not be compiled. Fix the ${label} syntax or component usage above, then reload the route.`
      : `This page could not be compiled. Fix the ${label} syntax or plugin error below, then reload the route.`,
    error,
    filePath,
    projectRoot,
    includeStack: phase === 'compilation',
  })
}

type CompileContentOptions = {
  filePath?: string
  projectRoot?: string
}

/**
 * Validate MDX content for diagnostics WITHOUT running the build-time rehype
 * pipeline (Shiki highlighting, slug injection, code-block parsing).
 *
 * `rehypePlugins` includes `rehypeShiki`, which loads grammar/WASM assets and
 * is expensive. The real highlighting happens at Vite build time via the
 * `@mdx-js/rollup` plugin (see `createContentCompilerPlugin` in
 * `core/adapters.ts`), which runs the full remark + rehype pipeline.
 * Re-running it here, during route discovery (Phase 3), would compile every
 * `.mdx` file twice and invoke Shiki once per file per `engine.refresh()` -
 * see ARCHITECTURE.md §2.2 which states "不应在 core 中执行代码高亮".
 *
 * The remark pipeline still runs (shared with the Vite plugin via
 * `remarkPlugins`), so MDX/JSX syntax errors - the only class of error this
 * diagnostic is meant to surface ahead of the Vite build - are caught. The
 * output is discarded; only the thrown error is used.
 *
 * `.md` files are handled by `compileMarkdownContent` in `markdown.ts`, which
 * mirrors the adapter's markdown compiler semantics (`format: 'md'`, raw HTML
 * allowed). Keep the two compilers separate so each format can evolve its own
 * diagnostic rules without contaminating the other.
 */
export async function compileMdxContent(content: string, options: CompileContentOptions = {}): Promise<{ ok: true } | { ok: false; diagnostic: ContentDiagnostic }> {
  const { filePath, projectRoot } = options
  try {
    await compile(content, {
      jsx: true,
      providerImportSource: '@clarify-labs/renderer',
      remarkPlugins: remarkPlugins as CompileOptions['remarkPlugins'],
      // NOTE: `rehypePlugins` intentionally omitted. See JSDoc above.
    })
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      diagnostic: createContentCompileDiagnostic({ format: 'mdx', phase: 'syntax', error, filePath, projectRoot }),
    }
  }
}
