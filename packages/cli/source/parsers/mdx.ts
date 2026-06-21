import GithubSlugger from 'github-slugger'
import { toString } from 'mdast-util-to-string'
import shiki, { type Highlighter } from 'shiki'
import { visit } from 'unist-util-visit'

import { markdownRemarkPlugins } from '@clarify-labs/renderer'

import { escapeHtml } from '../core/utils.js'

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

type ShikiRenderElementArgs = {
  children: string
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

let highlighter: Highlighter | undefined

async function getHighlighter(): Promise<Highlighter> {
  highlighter = highlighter ?? await shiki.getHighlighter({ theme: 'css-variables' })
  return highlighter
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
    })
  }
}

export function rehypeShiki() {
  return async (tree: HastNode) => {
    const shikiHighlighter = await getHighlighter()

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
          const tokens = shikiHighlighter.codeToThemedTokens(code, language)
          highlighted = shiki.renderToHtml(tokens, {
            elements: {
              pre: ({ children }: ShikiRenderElementArgs) => children,
              code: ({ children }: ShikiRenderElementArgs) => children,
              line: ({ children }: ShikiRenderElementArgs) => `<span>${children}</span>`,
            },
          })
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

export const remarkPlugins = markdownRemarkPlugins
export const rehypePlugins = [rehypeSlugSections, rehypeParseCodeBlocks, rehypeShiki]
