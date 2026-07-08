import { compile, type CompileOptions } from '@mdx-js/mdx'
import GithubSlugger from 'github-slugger'
import { toString } from 'mdast-util-to-string'
import shiki, { type Highlighter } from 'shiki'
import { visit } from 'unist-util-visit'

import type { ContentDiagnosticMetadata, ContentDocument } from '../content/index'
import { markdownRemarkPlugins } from '../markdown/remark'

type ContentRouteLike = {
  filePath?: string
}

type CompileContentDocumentPageOptions = {
  document: ContentDocument
  route?: ContentRouteLike
  projectRoot?: string
}

type CompileContentDocumentPageResult = {
  code: string
}

type CompiledMarkdownBlock = {
  index: number
  code: string
  componentName: string
}

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

function moduleSpecifier(value: string): string {
  return JSON.stringify(value)
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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

function rehypeParseCodeBlocks() {
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

function rehypeShiki() {
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

      codeNode.properties.highlightedHtml = highlighted
    })
  }
}

function rehypeSlugSections() {
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

const rehypePlugins = [rehypeSlugSections, rehypeParseCodeBlocks, rehypeShiki]

function formatMdxDiagnostic(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function formatDiagnosticFilePath(filePath: string | undefined, projectRoot: string | undefined): string | undefined {
  if (!filePath) return undefined
  if (projectRoot && filePath.startsWith(`${projectRoot}/`)) return filePath.slice(projectRoot.length + 1)
  return filePath.replace(/^[A-Za-z]:\//, '').replace(/^\/+/, '')
}

function createMdxDiagnostic(error: unknown, filePath: string | undefined, projectRoot: string | undefined): ContentDiagnosticMetadata {
  return {
    kind: 'mdx',
    title: 'MDX syntax error',
    message: 'This page could not be compiled. Fix the MDX syntax or component usage above, then reload the route.',
    filePath: formatDiagnosticFilePath(filePath, projectRoot),
    details: formatMdxDiagnostic(error),
  }
}

function removeMdxProviderImport(code: string): string {
  return code
    .replace(/import \{Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs\} from ["']react\/jsx-runtime["'];?\n?/g, '')
    .replace(/import \{useMDXComponents as _provideComponents\} from ["']@clarify-labs\/renderer\/client["'];?\n?/g, '')
}

function createMarkdownBlockComponent(compiledMdx: string, index: number): CompiledMarkdownBlock {
  const componentName = `MarkdownBlock${index}`
  const contentName = `_createMdxContent${index}`
  const code = removeMdxProviderImport(compiledMdx)
    .replace(/_createMdxContent/g, contentName)
    .replace(/export default function MDXContent/g, `function ${componentName}`)

  return { index, code, componentName }
}

function createPageModule(compiledBlocks: CompiledMarkdownBlock[], document: ContentDocument): string {
  const markdownComponents = `[${compiledBlocks.map(block => block.componentName).join(', ')}]`

  return `import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useMDXComponents as _provideComponents, createComponentRouteComponent, renderContentDocument } from '@clarify-labs/renderer/client';

${compiledBlocks.map(block => block.code).join('\n\n')}

export const routeData = ${JSON.stringify({ contentDocument: document })};
const markdownComponents = ${markdownComponents};

function PageContent() {
  let markdownIndex = 0;
  return renderContentDocument(routeData.contentDocument, {
    markdown() {
      const MarkdownComponent = markdownComponents[markdownIndex++];
      return MarkdownComponent ? _jsx(MarkdownComponent, {}) : null;
    },
  });
}

export default createComponentRouteComponent({ component: PageContent });
`
}

async function compileMarkdownBlock(value: string, index: number): Promise<CompiledMarkdownBlock> {
  const compiled = await compile(value, {
    jsx: false,
    providerImportSource: '@clarify-labs/renderer/client',
    remarkPlugins: markdownRemarkPlugins as CompileOptions['remarkPlugins'],
    rehypePlugins: rehypePlugins as CompileOptions['rehypePlugins'],
  })

  return createMarkdownBlockComponent(String(compiled), index)
}

export async function compileContentDocumentPage(options: CompileContentDocumentPageOptions): Promise<CompileContentDocumentPageResult> {
  try {
    const compiledBlocks = await Promise.all(options.document.content
      .map((block, index) => block.kind === 'markdown' ? compileMarkdownBlock(block.value, index) : undefined)
      .filter((block): block is Promise<CompiledMarkdownBlock> => Boolean(block)))

    return { code: createPageModule(compiledBlocks, options.document) }
  } catch (error) {
    throw createMdxDiagnostic(error, options.route?.filePath ?? options.document.source, options.projectRoot)
  }
}
