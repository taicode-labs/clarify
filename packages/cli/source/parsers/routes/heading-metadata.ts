import type { ContentRoute } from '../../types.js'
import { analyzeHeadings } from '../markdown/headings.js'
import { compileMarkdownContent } from '../markdown/markdown.js'
import { compileMdxContent } from '../markdown/mdx.js'

type HeadingAnalysis = ReturnType<typeof analyzeHeadings>

export function kebabToTitle(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function headingMetadata(analysis: HeadingAnalysis): Pick<ContentRoute['meta'], 'sections'> {
  const sections = analysis.headings
    .filter(heading => heading.level === 2 || heading.level === 3)
    .map(heading => ({
      id: heading.id,
      title: heading.title,
      level: heading.level,
    }))
  return { sections }
}

function resolvedRouteTitle(route: ContentRoute, analysis: HeadingAnalysis): string {
  const frontmatterTitle = route.source.frontmatter?.title
  if (typeof frontmatterTitle === 'string' && frontmatterTitle) return frontmatterTitle

  const routePath = route.basePath ?? route.path
  const stem = routePath === '/'
    ? analysis.headings.find(heading => heading.level === 1)?.title ?? ''
    : routePath.split('/').filter(Boolean).at(-1) ?? ''
  return kebabToTitle(stem) || 'Untitled'
}

export async function reanalyzeMarkdownRoute(route: ContentRoute, projectRoot: string): Promise<ContentRoute> {
  if (route.kind !== 'markdown' && route.kind !== 'markdown+jsx') return route

  const analysis = analyzeHeadings(route.source.content ?? '', {
    kind: route.kind,
    filePath: route.source.filePath,
    projectRoot,
    lineOffset: route.source.lineOffset,
  })
  const compile = route.kind === 'markdown' ? compileMarkdownContent : compileMdxContent
  const result = await compile(analysis.normalizedContent, { filePath: route.source.filePath, projectRoot })
  return {
    ...route,
    meta: { ...route.meta, title: resolvedRouteTitle(route, analysis), ...headingMetadata(analysis) },
    diagnostic: analysis.diagnostic ?? (result.ok ? undefined : result.diagnostic),
  }
}
