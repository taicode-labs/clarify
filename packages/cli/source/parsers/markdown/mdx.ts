import { compile, type CompileOptions } from '@mdx-js/mdx'
import GithubSlugger from 'github-slugger'
import { toString } from 'mdast-util-to-string'
import { bundledLanguages, createCssVariablesTheme, createHighlighter, type BundledLanguage, type Highlighter } from 'shiki'
import { visit } from 'unist-util-visit'

import { markdownRemarkPlugins } from '@clarify-labs/renderer'

import type { ContentDiagnostic } from '../../types.js'
import { escapeHtml } from '../markdown/utils.js'

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

function getTextContent(node: HastNode | undefined): string {
  if (!node) return ''
  if (typeof node.value === 'string') return node.value
  return node.children?.map(getTextContent).join('') ?? ''
}

function renderPlainCode(code: string): string {
  return code
    .split('\n')
    .map(line => `<span>${escapeHtml(line)}</span>`)
    .join('\n')
}

function isBundledLanguage(language: string): language is BundledLanguage {
  return language in bundledLanguages
}

let highlighterPromise: Promise<Highlighter> | undefined
const cssVariablesTheme = createCssVariablesTheme()

async function getHighlighter(): Promise<Highlighter> {
  highlighterPromise = highlighterPromise ?? createHighlighter({ themes: [cssVariablesTheme], langs: [] })
  return highlighterPromise
}

function renderHighlightedCode(html: string): string {
  const codeMatch = /<code[^>]*>([\s\S]*?)<\/code>/.exec(html)
  const codeHtml = codeMatch?.[1] ?? html
  return codeHtml
    .split('\n')
    .map(line => line.trimStart().startsWith('<span') ? line : `<span>${line}</span>`)
    .join('\n')
}

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

export function rehypeShiki() {
  return async (tree: HastNode) => {
    const shikiHighlighter = await getHighlighter()
    const languages = new Set<BundledLanguage>()

    visit(tree, 'element', (node: HastNode) => {
      if (node.tagName !== 'pre') return
      const codeNode = node.children?.[0]
      if (codeNode?.tagName !== 'code') return
      const language = typeof node.properties?.language === 'string' ? node.properties.language : getLanguage(codeNode.properties?.className)
      if (language && language !== 'txt' && isBundledLanguage(language)) languages.add(language)
    })

    if (languages.size > 0) await shikiHighlighter.loadLanguage(...languages)

    visit(tree, 'element', (node: HastNode) => {
      if (node.tagName !== 'pre') return
      const codeNode = node.children?.[0]
      if (codeNode?.tagName !== 'code') return

      node.properties = node.properties ?? {}
      codeNode.properties = codeNode.properties ?? {}

      const code = getTextContent(codeNode)
      const language = typeof node.properties.language === 'string' ? node.properties.language : getLanguage(codeNode.properties.className)
      node.properties.code = code
      codeNode.properties.code = code
      codeNode.properties.language = language

      let highlighted = renderPlainCode(code)

      if (language && language !== 'txt') {
        try {
          const html = shikiHighlighter.codeToHtml(code, { lang: language, theme: cssVariablesTheme })
          highlighted = renderHighlightedCode(html)
        } catch {
          highlighted = renderPlainCode(code)
        }
      }

      codeNode.children = [{ type: 'text', value: highlighted }]
    })
  }
}

export function rehypeSlugSections() {
  return (tree: HastNode) => {
    const slugger = new GithubSlugger()

    visit(tree, 'element', (node: HastNode) => {
      if (node.tagName !== 'h2' && node.tagName !== 'h3') return

      node.properties = node.properties ?? {}
      if (node.properties.id) return

      node.properties.id = slugger.slug(toString(node))
    })
  }
}

export const remarkPlugins: unknown[] = markdownRemarkPlugins
export const rehypePlugins = [rehypeSlugSections, rehypeParseCodeBlocks, rehypeShiki]

function formatMdxDiagnostic(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

/**
 * Validate MDX content for diagnostics WITHOUT running the build-time rehype
 * pipeline (Shiki highlighting, slug injection, code-block parsing).
 *
 * `rehypePlugins` includes `rehypeShiki`, which loads grammar/WASM assets and
 * is expensive. The real highlighting happens at Vite build time via the
 * `@mdx-js/rollup` plugins (see `createMarkdownPlugin` and `createMdxPlugin`
 * in `core/adapters.ts`), which
 * runs the full remark + rehype pipeline. Re-running it here, during route
 * discovery (Phase 3), would compile every `.mdx` file twice and invoke Shiki
 * once per file per `engine.refresh()` — see ARCHITECTURE.md §2.2 which states
 * "不应在 core 中执行代码高亮".
 *
 * The remark pipeline still runs (shared with the Vite plugin via
 * `remarkPlugins`), so MDX/JSX syntax errors — the only class of error this
 * diagnostic is meant to surface ahead of the Vite build — are caught. The
 * output is discarded; only the thrown error is used.
 */
export async function compileMdxContent(content: string, filePath?: string, projectRoot?: string): Promise<{ ok: true } | { ok: false; diagnostic: ContentDiagnostic }> {
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
      diagnostic: {
        kind: 'mdx',
        title: 'MDX syntax error',
        message: 'This page could not be compiled. Fix the MDX syntax or component usage above, then reload the route.',
        filePath: filePath && projectRoot
          ? filePath.replace(projectRoot + '/', '').replace(/^\/+/, '')
          : filePath ? filePath.replace(/^[A-Za-z]:\//, '').replace(/^\/+/, '') : undefined,
        details: formatMdxDiagnostic(error),
      },
    }
  }
}
