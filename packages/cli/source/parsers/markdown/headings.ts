import { createProcessor } from '@mdx-js/mdx'
import GithubSlugger from 'github-slugger'
import { toString } from 'mdast-util-to-string'
import rehypeRaw from 'rehype-raw'
import { remark } from 'remark'

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
  value?: string
  url?: string
  children?: MarkdownNode[]
  data?: { hProperties?: Record<string, unknown> }
  position?: { start: Position; end: Position }
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

type RawHtmlHeading = {
  title: string
  id?: string
  position: AnalyzedHeading['position']
  offset: number
  openingTagEnd: number
}

type DocumentHeading = {
  title: string
  offset: number
  markdown?: AnalyzedHeading
  raw?: RawHtmlHeading
}

const INTERNAL_HEADING_ID_PREFIX = 'clarify-internal-heading-id:'
const EXPLICIT_ID_PATTERN = /\s+\{#([^{}]*)\}$/

function visitHeadings(node: MarkdownNode, callback: (heading: MarkdownNode) => void): void {
  if (node.type === 'heading') callback(node)
  for (const child of node.children ?? []) visitHeadings(child, callback)
}

function visitHtml(node: MarkdownNode, callback: (html: MarkdownNode) => void): void {
  if (node.type === 'html') callback(node)
  for (const child of node.children ?? []) visitHtml(child, callback)
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

function headingPosition(node: MarkdownNode): AnalyzedHeading['position'] {
  return {
    line: node.position?.start.line ?? 1,
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

function headingTitle(heading: MarkdownNode, marker: ExplicitHeadingId | undefined): string {
  const text = finalTextNode(heading)
  if (!text || !marker || text.value === undefined) return toString(heading as never)

  const original = text.value
  text.value = original.slice(0, -(marker.end - marker.start)).replace(/\s+$/, '')
  const title = toString(heading as never)
  text.value = original
  return title
}

function maskExplicitHeadingMarkers(content: string): string {
  const tree = remark.parse(content) as unknown as MarkdownNode
  const edits: SourceEdit[] = []
  visitHeadings(tree, (heading) => {
    const marker = explicitIdInfo(heading, content)
    if (marker) edits.push({ start: marker.start, end: marker.end, replacement: 'x'.repeat(marker.end - marker.start) })
  })
  return applySourceEdits(content, edits)
}

function parseHeadingTree(content: string, kind: AnalyzeHeadingsOptions['kind']): MarkdownNode | undefined {
  if (kind === 'markdown') return remark.parse(content) as unknown as MarkdownNode

  // Explicit heading markers use braces, which MDX would otherwise parse as
  // expressions. Mask only markers confirmed by a Markdown heading parse,
  // preserving every UTF-16 offset and leaving literal marker-shaped text
  // inside code or escapes intact.
  const maskedContent = maskExplicitHeadingMarkers(content)
  try {
    return createProcessor({ format: 'mdx' }).parse(maskedContent) as unknown as MarkdownNode
  } catch {
    return undefined
  }
}

function openingTagEnd(content: string, start: number, end: number): number | undefined {
  let quote: '"' | "'" | undefined
  for (let index = start; index < end; index++) {
    const character = content[index]
    if (quote) {
      if (character === quote) quote = undefined
    } else if (character === '"' || character === "'") {
      quote = character
    } else if (character === '>') {
      return index
    }
  }
  return undefined
}

function rawHtmlHeadings(tree: MarkdownNode, content: string): RawHtmlHeading[] {
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

  const headings: RawHtmlHeading[] = []
  visitHastHeadings(hast, (heading) => {
    const offset = heading.position?.start.offset
    const headingEnd = heading.position?.end.offset
    if (offset === undefined || headingEnd === undefined || markdownOffsets.has(offset)) return
    const tagEnd = openingTagEnd(content, offset, headingEnd)
    if (tagEnd === undefined) return
    const rawId = heading.properties?.id
    headings.push({
      title: hastText(heading),
      ...(typeof rawId === 'string' && rawId ? { id: rawId } : {}),
      position: {
        line: heading.position?.start.line ?? 1,
        column: heading.position?.start.column ?? 1,
      },
      offset,
      openingTagEnd: tagEnd,
    })
  })

  return headings
}

function escapeHtmlAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
}

export function analyzeHeadings(content: string, options: AnalyzeHeadingsOptions): HeadingAnalysis {
  const slugger = new GithubSlugger()
  const headings: AnalyzedHeading[] = []
  const edits: SourceEdit[] = []
  const errors: string[] = []
  const ids = new Map<string, IdOwner>()
  const documentHeadings: DocumentHeading[] = []
  const tree = parseHeadingTree(content, options.kind)
  if (!tree) return { headings, normalizedContent: content }

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
    const title = headingTitle(node, marker)
    const legacySlug = slugger.slug(title)
    const hasValidExplicitId = marker !== undefined && HEADING_ID_PATTERN.test(marker.id)
    const canonicalId = hasValidExplicitId ? marker.id : legacySlug
    const legacyIds = marker !== undefined && legacySlug !== canonicalId ? [legacySlug] : []
    const heading: AnalyzedHeading = {
      level: (node.depth ?? 1) as AnalyzedHeading['level'],
      title,
      canonicalId,
      legacyIds,
      position: headingPosition(node),
    }

    if (marker && !hasValidExplicitId) {
      errors.push(`Invalid heading ID "${marker.id}" at ${formatPosition(heading.position)}. IDs must match [a-z0-9]+(?:-[a-z0-9]+)*.`)
    }

    headings.push(heading)
    documentHeadings.push({
      title,
      offset: node.position?.start.offset ?? 0,
      markdown: heading,
    })

    const link = ` [](clarify-internal-heading-id:${canonicalId})`
    const contentEnd = contentEndOffset(node)
    if (marker) {
      edits.push({ start: marker.start, end: marker.end, replacement: link })
    } else if (contentEnd !== undefined) {
      edits.push({ start: contentEnd, end: contentEnd, replacement: link })
    }
  })

  if (options.kind === 'markdown') {
    for (const raw of rawHtmlHeadings(tree, content)) {
      documentHeadings.push({ title: raw.title, offset: raw.offset, raw })
    }
  }

  documentHeadings.sort((left, right) => left.offset - right.offset)
  for (const documentHeading of documentHeadings) {
    if (documentHeading.markdown) {
      claimId(documentHeading.markdown.canonicalId, documentHeading.markdown.position)
      for (const legacyId of documentHeading.markdown.legacyIds) claimId(legacyId, documentHeading.markdown.position)
    } else if (documentHeading.raw?.id) {
      claimId(documentHeading.raw.id, documentHeading.raw.position)
    }
  }

  const fallbackSlugger = new GithubSlugger()
  const reservedIds = new Set(ids.keys())
  for (const documentHeading of documentHeadings) {
    let fallbackId = fallbackSlugger.slug(documentHeading.title)
    const raw = documentHeading.raw
    if (!raw || raw.id) continue
    while (reservedIds.has(fallbackId)) fallbackId = fallbackSlugger.slug(documentHeading.title)
    reservedIds.add(fallbackId)
    edits.push({
      start: raw.openingTagEnd,
      end: raw.openingTagEnd,
      replacement: ` id="${escapeHtmlAttribute(fallbackId)}"`,
    })
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
