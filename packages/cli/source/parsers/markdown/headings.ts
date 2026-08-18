import { createProcessor } from '@mdx-js/mdx'
import GithubSlugger from 'github-slugger'
import { toString } from 'mdast-util-to-string'
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

const INTERNAL_HEADING_ID_PREFIX = 'clarify-internal-heading-id:'
const EXPLICIT_ID_PATTERN = /\s+\{#([^{}]*)\}$/
const EXPLICIT_ID_CANDIDATE_PATTERN = /\{#[^{}\r\n]*\}/g

function visitHeadings(node: MarkdownNode, callback: (heading: MarkdownNode) => void): void {
  if (node.type === 'heading') callback(node)
  for (const child of node.children ?? []) visitHeadings(child, callback)
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

function parseHeadingTree(content: string, kind: AnalyzeHeadingsOptions['kind']): MarkdownNode {
  if (kind === 'markdown') return remark.parse(content) as unknown as MarkdownNode

  // Explicit heading markers use braces, which MDX would otherwise parse as
  // expressions. Mask candidates only for parsing, preserving every UTF-16
  // offset so edits can still be derived from the untouched author source.
  const maskedContent = content.replace(EXPLICIT_ID_CANDIDATE_PATTERN, marker => 'x'.repeat(marker.length))
  try {
    return createProcessor({ format: 'mdx' }).parse(maskedContent) as unknown as MarkdownNode
  } catch {
    // Keep invalid MDX on the diagnostic path instead of aborting discovery.
    // The later MDX compile reports the syntax error with the original source.
    return remark.parse(maskedContent) as unknown as MarkdownNode
  }
}

export function analyzeHeadings(content: string, options: AnalyzeHeadingsOptions): HeadingAnalysis {
  const slugger = new GithubSlugger()
  const headings: AnalyzedHeading[] = []
  const edits: SourceEdit[] = []
  const errors: string[] = []
  const ids = new Map<string, IdOwner>()
  const tree = parseHeadingTree(content, options.kind)

  const claimId = (id: string, heading: AnalyzedHeading) => {
    const owner = ids.get(id)
    if (owner) {
      errors.push(`Heading ID "${id}" at ${formatPosition(heading.position)} conflicts with the heading at ${formatPosition(owner.position)}.`)
      return
    }
    ids.set(id, { id, position: heading.position })
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

    claimId(canonicalId, heading)
    for (const legacyId of legacyIds) claimId(legacyId, heading)
    headings.push(heading)

    const link = ` [](clarify-internal-heading-id:${canonicalId})`
    const contentEnd = contentEndOffset(node)
    if (marker) {
      edits.push({ start: marker.start, end: marker.end, replacement: link })
    } else if (contentEnd !== undefined) {
      edits.push({ start: contentEnd, end: contentEnd, replacement: link })
    }
  })

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
