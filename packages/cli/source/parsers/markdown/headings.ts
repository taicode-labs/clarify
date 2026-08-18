import { createProcessor, type CompileOptions } from '@mdx-js/mdx'
import GithubSlugger from 'github-slugger'
import rehypeRaw from 'rehype-raw'

import { markdownRemarkPlugins } from '@clarify-labs/renderer'

import type { ContentDiagnostic } from '../../types.js'
import { createContentDiagnostic } from '../content/diagnostic.js'

export const HEADING_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export type AnalyzedHeading = {
  level: 1 | 2 | 3 | 4 | 5 | 6
  title: string
  canonicalId: string
  legacyIds: string[]
  position: { line: number; column: number }
}

export type AnalyzeHeadingsOptions = {
  kind: 'markdown' | 'markdown+jsx'
  filePath?: string
  projectRoot?: string
  lineOffset?: number
}

export type HeadingAnalysis = {
  headings: AnalyzedHeading[]
  normalizedContent: string
  diagnostic?: ContentDiagnostic
}

type Position = {
  line: number
  column: number
  offset?: number
}

type MarkdownNode = {
  type: string
  depth?: number
  name?: string | null
  value?: string
  url?: string
  children?: MarkdownNode[]
  attributes?: MdxJsxAttribute[]
  data?: { hProperties?: Record<string, unknown> }
  position?: { start: Position; end: Position }
}

type MdxJsxAttribute = {
  type: string
  name?: string
  value?: string | null | { type: string; value?: string }
}

type HastNode = {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
  position?: { start: Position; end: Position }
}

type SourceEdit = {
  start: number
  end: number
  replacement: string
}

type ExplicitHeadingId = {
  id: string
  start: number
  end: number
}

type IdOwner = {
  id: string
  position: AnalyzedHeading['position']
}

type RenderedHeading = {
  title?: string
  id?: string
  position: AnalyzedHeading['position']
  offset: number
  attributeOffset: number
}

type DocumentHeading = {
  title?: string
  offset: number
  markdown?: AnalyzedHeading
  rendered?: RenderedHeading
}

const INTERNAL_HEADING_ID_PREFIX = 'clarify-internal-heading-id:'
const EXPLICIT_ID_PATTERN = /\s+\{#([^{}]*)\}$/
const HEADING_REMARK_PLUGINS = markdownRemarkPlugins as CompileOptions['remarkPlugins']

function visitHeadings(node: MarkdownNode, callback: (heading: MarkdownNode) => void): void {
  if (node.type === 'heading') callback(node)
  for (const child of node.children ?? []) visitHeadings(child, callback)
}

function visitHtml(node: MarkdownNode, callback: (html: MarkdownNode) => void): void {
  if (node.type === 'html') callback(node)
  for (const child of node.children ?? []) visitHtml(child, callback)
}

function visitMdxIntrinsicHeadings(node: MarkdownNode, callback: (heading: MarkdownNode) => void): void {
  if ((node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name && /^h[1-6]$/.test(node.name)) callback(node)
  for (const child of node.children ?? []) visitMdxIntrinsicHeadings(child, callback)
}

function visitHastHeadings(node: HastNode, callback: (heading: HastNode) => void): void {
  if (node.type === 'element' && node.tagName && /^h[1-6]$/.test(node.tagName)) callback(node)
  for (const child of node.children ?? []) visitHastHeadings(child, callback)
}

function hastText(node: HastNode): string {
  if (node.type === 'text') return node.value ?? ''
  return (node.children ?? []).map(hastText).join('')
}

function applySourceEdits(content: string, edits: SourceEdit[]): string {
  return edits
    .sort((left, right) => right.start - left.start)
    .reduce((result, edit) => result.slice(0, edit.start) + edit.replacement + result.slice(edit.end), content)
}

function headingPosition(node: MarkdownNode, lineOffset: number): AnalyzedHeading['position'] {
  return {
    line: (node.position?.start.line ?? 1) + lineOffset,
    column: node.position?.start.column ?? 1,
  }
}

function formatPosition(position: AnalyzedHeading['position']): string {
  return `${position.line}:${position.column}`
}

function finalTextNode(heading: MarkdownNode): MarkdownNode | undefined {
  const node = heading.children?.at(-1)
  return node?.type === 'text' && typeof node.value === 'string' ? node : undefined
}

function contentEndOffset(heading: MarkdownNode): number | undefined {
  const finalChild = heading.children?.at(-1)
  return finalChild?.position?.end.offset ?? heading.position?.end.offset
}

function explicitIdInfo(heading: MarkdownNode, content: string): ExplicitHeadingId | undefined {
  const text = finalTextNode(heading)
  if (!text?.position) return undefined

  const startOffset = text.position.start.offset
  const endOffset = text.position.end.offset
  if (startOffset === undefined || endOffset === undefined) return undefined

  const source = content.slice(startOffset, endOffset)
  const match = source.match(EXPLICIT_ID_PATTERN)
  if (!match || match.index === undefined) return undefined

  return {
    id: match[1] ?? '',
    start: startOffset + match.index,
    end: startOffset + match.index + match[0].length,
  }
}

function maskExplicitHeadingMarkers(content: string): string {
  const tree = createProcessor({ format: 'md', remarkPlugins: HEADING_REMARK_PLUGINS }).parse(content) as unknown as MarkdownNode
  const edits: SourceEdit[] = []
  visitHeadings(tree, (heading) => {
    const marker = explicitIdInfo(heading, content)
    if (marker) edits.push({ start: marker.start, end: marker.end, replacement: 'x'.repeat(marker.end - marker.start) })
  })
  return applySourceEdits(content, edits)
}

function parseHeadingTree(content: string, kind: AnalyzeHeadingsOptions['kind']): MarkdownNode | undefined {
  if (kind === 'markdown') {
    return createProcessor({ format: 'md', remarkPlugins: HEADING_REMARK_PLUGINS }).parse(content) as unknown as MarkdownNode
  }

  // Explicit heading markers use braces, which MDX would otherwise parse as
  // expressions. Mask only markers confirmed by a Markdown heading parse,
  // preserving every UTF-16 offset and leaving literal marker-shaped text
  // inside code or escapes intact.
  const maskedContent = maskExplicitHeadingMarkers(content)
  try {
    return createProcessor({ format: 'mdx', remarkPlugins: HEADING_REMARK_PLUGINS }).parse(maskedContent) as unknown as MarkdownNode
  } catch {
    return undefined
  }
}

function renderedMarkdownHeadingTitles(tree: MarkdownNode, content: string, kind: AnalyzeHeadingsOptions['kind']): Map<number, string> {
  const originalText = new Map<MarkdownNode, string>()
  visitHeadings(tree, (heading) => {
    const marker = explicitIdInfo(heading, content)
    const text = finalTextNode(heading)
    if (!marker || !text || text.value === undefined) return
    originalText.set(text, text.value)
    text.value = text.value.slice(0, -(marker.end - marker.start)).replace(/\s+$/, '')
  })

  try {
    let hast: HastNode | undefined
    const captureHast = () => (tree: HastNode) => { hast = tree }
    const processor = createProcessor({
      format: kind === 'markdown' ? 'md' : 'mdx',
      remarkPlugins: HEADING_REMARK_PLUGINS,
      ...(kind === 'markdown' ? { remarkRehypeOptions: { allowDangerousHtml: true } } : {}),
      rehypePlugins: kind === 'markdown' ? [rehypeRaw, captureHast] : [captureHast],
    })
    processor.runSync(tree as never, { value: content } as never)

    const titles = new Map<number, string>()
    if (!hast) return titles
    visitHastHeadings(hast, (heading) => {
      const offset = heading.position?.start.offset
      if (offset !== undefined) titles.set(offset, hastText(heading))
    })
    return titles
  } finally {
    for (const [text, value] of originalText) text.value = value
  }
}

function isHtmlWhitespace(character: string | undefined): boolean {
  return character === '\t' || character === '\n' || character === '\f' || character === '\r' || character === ' '
}

function isMdxWhitespace(character: string | undefined): boolean {
  return /\s/u.test(character ?? '')
}

function openingTagAttributeOffset(content: string, start: number, end: number, isWhitespace: (character: string | undefined) => boolean): number | undefined {
  type State = 'tagName' | 'beforeAttributeName' | 'attributeName' | 'afterAttributeName'
    | 'beforeAttributeValue' | 'quotedAttributeValue' | 'afterQuotedAttributeValue' | 'unquotedAttributeValue'

  let state: State = 'tagName'
  let quote: '"' | "'" | undefined
  for (let index = start; index < end; index++) {
    const character = content[index]
    const closesTag = character === '>'
    const selfClosesTag = character === '/' && content[index + 1] === '>'

    if (state === 'quotedAttributeValue') {
      if (character === quote) {
        quote = undefined
        state = 'afterQuotedAttributeValue'
      }
      continue
    }
    if (state === 'unquotedAttributeValue') {
      if (closesTag) return index
      if (isWhitespace(character)) state = 'beforeAttributeName'
      continue
    }
    if (closesTag) return index
    if (selfClosesTag && state !== 'beforeAttributeValue') {
      let cursor = index
      while (cursor > start && isWhitespace(content[cursor - 1])) cursor--
      return cursor
    }

    if (state === 'tagName') {
      if (isWhitespace(character)) state = 'beforeAttributeName'
    } else if (state === 'beforeAttributeName') {
      if (!isWhitespace(character)) state = 'attributeName'
    } else if (state === 'attributeName') {
      if (character === '=') state = 'beforeAttributeValue'
      else if (isWhitespace(character)) state = 'afterAttributeName'
    } else if (state === 'afterAttributeName') {
      if (character === '=') state = 'beforeAttributeValue'
      else if (!isWhitespace(character)) state = 'attributeName'
    } else if (state === 'beforeAttributeValue') {
      if (character === '"' || character === "'") {
        quote = character
        state = 'quotedAttributeValue'
      } else if (!isWhitespace(character)) {
        state = 'unquotedAttributeValue'
      }
    } else if (state === 'afterQuotedAttributeValue' && isWhitespace(character)) {
      state = 'beforeAttributeName'
    }
  }
  return undefined
}

function rawHtmlHeadings(tree: MarkdownNode, content: string, lineOffset: number): RenderedHeading[] {
  let hasRawHtml = false
  visitHtml(tree, () => { hasRawHtml = true })
  if (!hasRawHtml) return []

  const markdownOffsets = new Set<number>()
  visitHeadings(tree, (heading) => {
    const offset = heading.position?.start.offset
    if (offset !== undefined) markdownOffsets.add(offset)
  })

  let hast: HastNode | undefined
  const captureHast = () => (tree: HastNode) => { hast = tree }
  const processor = createProcessor({
    format: 'md',
    remarkRehypeOptions: { allowDangerousHtml: true },
    rehypePlugins: [rehypeRaw, captureHast],
  })
  processor.runSync(tree as never, { value: content } as never)
  if (!hast) return []

  const headings: RenderedHeading[] = []
  visitHastHeadings(hast, (heading) => {
    const offset = heading.position?.start.offset
    const headingEnd = heading.position?.end.offset
    if (offset === undefined || headingEnd === undefined || markdownOffsets.has(offset)) return
    const tagEnd = openingTagAttributeOffset(content, offset, headingEnd, isHtmlWhitespace)
    if (tagEnd === undefined) return
    const rawId = heading.properties?.id
    headings.push({
      title: hastText(heading),
      ...(typeof rawId === 'string' && rawId ? { id: rawId } : {}),
      position: {
        line: (heading.position?.start.line ?? 1) + lineOffset,
        column: heading.position?.start.column ?? 1,
      },
      offset,
      attributeOffset: tagEnd,
    })
  })

  return headings
}

function staticMdxText(node: MarkdownNode): string | undefined {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value ?? ''
  if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
    if (!node.name || !/^[a-z][a-z0-9-]*$/.test(node.name)) return undefined
  } else if (!node.children) {
    return undefined
  }

  const parts: string[] = []
  for (const child of node.children ?? []) {
    const text = staticMdxText(child)
    if (text === undefined) return undefined
    parts.push(text)
  }
  return parts.join('')
}

function literalMdxId(node: MarkdownNode): { kind: 'literal'; id: string } | { kind: 'missing' | 'unknown' } {
  let result: { kind: 'literal'; id: string } | { kind: 'missing' | 'unknown' } = { kind: 'missing' }
  for (const attribute of node.attributes ?? []) {
    if (attribute.type !== 'mdxJsxAttribute') {
      result = { kind: 'unknown' }
      continue
    }
    if (attribute.name !== 'id') continue
    result = typeof attribute.value === 'string'
      ? { kind: 'literal', id: attribute.value }
      : { kind: 'unknown' }
  }
  return result
}

function hasOnlyStaticMdxAttributes(node: MarkdownNode): boolean {
  return (node.attributes ?? []).every(attribute =>
    attribute.type === 'mdxJsxAttribute'
    && (attribute.value === null || attribute.value === undefined || typeof attribute.value === 'string'))
}

function mdxIntrinsicHeadings(tree: MarkdownNode, content: string, lineOffset: number): RenderedHeading[] {
  const headings: RenderedHeading[] = []
  visitMdxIntrinsicHeadings(tree, (heading) => {
    const position = heading.position
    const offset = position?.start.offset
    const end = position?.end.offset
    const title = staticMdxText(heading)
    const literalId = literalMdxId(heading)
    if (!position || offset === undefined || end === undefined || literalId.kind === 'unknown') return
    if (literalId.kind === 'missing' && (title === undefined || !hasOnlyStaticMdxAttributes(heading))) return
    const tagEnd = openingTagAttributeOffset(content, offset, end, isMdxWhitespace)
    if (tagEnd === undefined) return
    headings.push({
      ...(title !== undefined ? { title } : {}),
      ...(literalId.kind === 'literal' ? { id: literalId.id } : {}),
      position: { line: position.start.line + lineOffset, column: position.start.column },
      offset,
      attributeOffset: tagEnd,
    })
  })
  return headings
}

function escapeHtmlAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
}

export function analyzeHeadings(content: string, options: AnalyzeHeadingsOptions): HeadingAnalysis {
  const lineOffset = options.lineOffset ?? 0
  const headings: AnalyzedHeading[] = []
  const edits: SourceEdit[] = []
  const errors: string[] = []
  const ids = new Map<string, IdOwner>()
  const documentHeadings: DocumentHeading[] = []
  const markdownHeadingInputs = new Map<AnalyzedHeading, {
    marker?: ExplicitHeadingId
    hasValidExplicitId: boolean
    contentEnd?: number
  }>()
  const tree = parseHeadingTree(content, options.kind)
  if (!tree) return { headings, normalizedContent: content }
  const renderedTitles = renderedMarkdownHeadingTitles(tree, content, options.kind)

  const claimId = (id: string, position: AnalyzedHeading['position']) => {
    const owner = ids.get(id)
    if (owner) {
      errors.push(`Heading ID "${id}" at ${formatPosition(position)} conflicts with the heading at ${formatPosition(owner.position)}.`)
      return
    }
    ids.set(id, { id, position })
  }

  visitHeadings(tree, (node) => {
    const marker = explicitIdInfo(node, content)
    const title = renderedTitles.get(node.position?.start.offset ?? 0) ?? ''
    const hasValidExplicitId = marker !== undefined && HEADING_ID_PATTERN.test(marker.id)
    const heading: AnalyzedHeading = {
      level: (node.depth ?? 1) as AnalyzedHeading['level'],
      title,
      canonicalId: hasValidExplicitId ? marker.id : '',
      legacyIds: [],
      position: headingPosition(node, lineOffset),
    }

    if (marker && !hasValidExplicitId) {
      errors.push(`Invalid heading ID "${marker.id}" at ${formatPosition(heading.position)}. IDs must match [a-z0-9]+(?:-[a-z0-9]+)*.`)
    }

    headings.push(heading)
    markdownHeadingInputs.set(heading, {
      ...(marker ? { marker } : {}),
      hasValidExplicitId,
      contentEnd: contentEndOffset(node),
    })
    documentHeadings.push({
      title,
      offset: node.position?.start.offset ?? 0,
      markdown: heading,
    })

  })

  const renderedHeadings = options.kind === 'markdown'
    ? rawHtmlHeadings(tree, content, lineOffset)
    : mdxIntrinsicHeadings(tree, content, lineOffset)
  for (const rendered of renderedHeadings) {
    documentHeadings.push({ ...(rendered.title !== undefined ? { title: rendered.title } : {}), offset: rendered.offset, rendered })
  }

  documentHeadings.sort((left, right) => left.offset - right.offset)
  const legacySlugger = new GithubSlugger()
  for (const documentHeading of documentHeadings) {
    if (documentHeading.title === undefined) continue
    const legacyId = legacySlugger.slug(documentHeading.title)
    if (documentHeading.markdown) {
      const heading = documentHeading.markdown
      const input = markdownHeadingInputs.get(heading)!
      heading.canonicalId = input.hasValidExplicitId ? input.marker!.id : legacyId
      heading.legacyIds = input.marker && legacyId !== heading.canonicalId ? [legacyId] : []

      const link = ` [](clarify-internal-heading-id:${heading.canonicalId})`
      if (input.marker) {
        edits.push({ start: input.marker.start, end: input.marker.end, replacement: link })
      } else if (input.contentEnd !== undefined) {
        edits.push({ start: input.contentEnd, end: input.contentEnd, replacement: link })
      }
    } else if (documentHeading.rendered && documentHeading.rendered.id === undefined) {
      documentHeading.rendered.id = legacyId
      edits.push({
        start: documentHeading.rendered.attributeOffset,
        end: documentHeading.rendered.attributeOffset,
        replacement: ` id="${escapeHtmlAttribute(legacyId)}"`,
      })
    }
  }

  for (const documentHeading of documentHeadings) {
    if (documentHeading.markdown) {
      claimId(documentHeading.markdown.canonicalId, documentHeading.markdown.position)
      for (const legacyId of documentHeading.markdown.legacyIds) claimId(legacyId, documentHeading.markdown.position)
    } else if (documentHeading.rendered?.id) {
      claimId(documentHeading.rendered.id, documentHeading.rendered.position)
    }
  }

  const diagnostic = errors.length === 0 ? undefined : createContentDiagnostic({
    kind: options.kind,
    title: 'Heading ID error',
    message: 'This page has invalid or conflicting heading IDs. Fix the IDs below, then reload the route.',
    error: new Error(errors.join('\n')),
    filePath: options.filePath,
    projectRoot: options.projectRoot,
  })

  return {
    headings,
    normalizedContent: applySourceEdits(content, edits),
    diagnostic,
  }
}

export function remarkApplyHeadingIds(): (tree: unknown) => void {
  return (tree) => {
    visitHeadings(tree as MarkdownNode, (heading) => {
      const finalNode = heading.children?.at(-1)
      if (finalNode?.type !== 'link' || finalNode.children?.length !== 0 || typeof finalNode.url !== 'string' || !finalNode.url.startsWith(INTERNAL_HEADING_ID_PREFIX)) return

      const id = finalNode.url.slice(INTERNAL_HEADING_ID_PREFIX.length)
      heading.children?.pop()
      const previousNode = heading.children?.at(-1)
      if (previousNode?.type === 'text' && typeof previousNode.value === 'string') {
        previousNode.value = previousNode.value.replace(/ $/, '')
      }
      heading.data = heading.data ?? {}
      heading.data.hProperties = { ...heading.data.hProperties, id }
    })
  }
}
