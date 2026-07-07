import { getContentRouteBasePath, getContentRouteIsBareAlias, getContentRouteLocale, getContentRoutePath, getContentRouteTitle } from '../../parsers/content/content-document.js'
import type { ContentRoute, ResolvedProjectConfig } from '../../types.js'

const UTF8_SIGNATURE = '\uFEFF'

function normalizeBasePath(basePath: string): string {
  if (!basePath || basePath === '/') return ''
  return '/' + basePath.replace(/^\/+|\/+$/g, '')
}

function containsNonAscii(content: string): boolean {
  return [...content].some(character => character.codePointAt(0)! > 0x7F)
}

function withUtf8Signature(content: string): string {
  if (!containsNonAscii(content) || content.startsWith(UTF8_SIGNATURE)) return content
  return `${UTF8_SIGNATURE}${content}`
}

function shouldUseUtf8Signature(route: ContentRoute): boolean {
  return route.kind !== 'openapi'
}

export function routeToMarkdownArtifactUrl(routePath: string): string {
  const normalizedPath = routePath === '/' ? '/index' : routePath.replace(/\/$/, '')
  return `${normalizedPath}.md`
}

export function routeToOpenAPIArtifactUrl(routePath: string): string {
  const normalizedPath = routePath === '/' ? '/index' : routePath.replace(/\/$/, '')
  return `${normalizedPath}.openapi.json`
}

export function attachContentArtifactUrls(routes: ContentRoute[]): void {
  for (const route of routes) {
    route.artifact = {
      ...route.artifact,
      contentArtifactUrl: route.kind === 'openapi'
        ? routeToOpenAPIArtifactUrl(route.path)
        : routeToMarkdownArtifactUrl(route.path),
    }
  }
}

export function readRouteContent(route: ContentRoute): string {
  if (route.source?.content !== undefined) return route.source.content
  throw new Error(`Route content is missing from route context: ${route.filePath}`)
}

export function readOpenAPIArtifactContent(route: ContentRoute): string {
  if (route.kind !== 'openapi') {
    throw new Error(`Expected an OpenAPI route but received ${route.kind}: ${route.filePath}`)
  }

  const content = route.source?.content
  if (content !== undefined) return content

  throw new Error(`OpenAPI artifact content is missing from route context: ${route.filePath}`)
}

export function readOpenAPIArtifactSpec(route: ContentRoute): Record<string, unknown> {
  return JSON.parse(readOpenAPIArtifactContent(route)) as Record<string, unknown>
}

export function readRouteArtifactContent(route: ContentRoute): string {
  const content = route.kind === 'openapi' ? readOpenAPIArtifactContent(route) : readRouteContent(route)
  return shouldUseUtf8Signature(route) ? withUtf8Signature(content) : content
}

function isLlmsTxtRoute(route: ContentRoute): boolean {
  return !getContentRoutePath(route).split('/').includes('404')
}

function llmsTxtDescription(route: ContentRoute): string | undefined {
  if (route.document?.metadata.description) return route.document.metadata.description

  const sections = route.document?.metadata.sections?.filter(section => section.level === 2).slice(0, 3).map(section => section.title)
  if (sections?.length) return `Covers ${sections.join(', ')}.`

  if (route.document?.metadata.keywords?.length) return `Related topics: ${route.document.metadata.keywords.join(', ')}.`

  if (route.kind === 'openapi') return 'OpenAPI artifact for machine-readable API reference data.'

  return undefined
}

function llmsTxtListItem(route: ContentRoute, basePath: string): string | undefined {
  if (!route.artifact?.contentArtifactUrl) return undefined

  const description = llmsTxtDescription(route)
  const title = getContentRouteTitle(route) ?? route.title
  return description
    ? `- [${title}](${basePath}${route.artifact.contentArtifactUrl}): ${description}`
    : `- [${title}](${basePath}${route.artifact.contentArtifactUrl})`
}

function llmsTxtLocaleLabel(locale: string, projectConfig: ResolvedProjectConfig): string {
  return projectConfig.i18n?.locales.find(item => item.code === locale)?.label ?? locale
}

function groupRoutesByLocale(routes: ContentRoute[]): Map<string, ContentRoute[]> {
  const groups = new Map<string, ContentRoute[]>()
  for (const route of routes) {
    const key = getContentRouteLocale(route) ?? 'default'
    groups.set(key, [...(groups.get(key) ?? []), route])
  }
  return groups
}

function groupLlmsTxtRoutesByLocale(routes: ContentRoute[], projectConfig: ResolvedProjectConfig): Map<string, ContentRoute[]> {
  const routesBySource = new Map<string, ContentRoute>()
  const defaultLocale = projectConfig.i18n?.defaultLocale

  for (const route of routes) {
    const sourceKey = `${getContentRouteLocale(route) ?? defaultLocale ?? 'default'}:${getContentRouteBasePath(route) ?? route.artifact?.contentArtifactUrl ?? getContentRoutePath(route)}`
    const previousRoute = routesBySource.get(sourceKey)

    if (!previousRoute || (previousRoute.locale && !route.locale)) {
      routesBySource.set(sourceKey, route)
    }
  }

  return groupRoutesByLocale([...routesBySource.values()].map(route => ({
    ...route,
    locale: getContentRouteLocale(route) ?? defaultLocale,
  })))
}

function llmsTxtDocsSectionTitle(locale: string, groupCount: number, projectConfig: ResolvedProjectConfig): string {
  if (groupCount <= 1) return 'Docs'
  return `Docs - ${locale === 'default' ? 'Default' : llmsTxtLocaleLabel(locale, projectConfig)}`
}

export function createLlmsTxt(routes: ContentRoute[], projectConfig: ResolvedProjectConfig): string {
  const basePath = normalizeBasePath(projectConfig.routePrefix)
  const lines = [
    `# ${projectConfig.title}`,
    '',
  ]

  if (projectConfig.description) {
    lines.push(`> ${projectConfig.description}`, '')
  }

  lines.push('This file lists the source-ready Markdown and OpenAPI artifacts for this documentation site.', '')

  // Exclude bare alias routes (e.g., /path without language prefix) in multilingual sites
  const documentRoutes = routes.filter(route => route.kind !== 'openapi' && isLlmsTxtRoute(route) && !getContentRouteIsBareAlias(route))
  if (documentRoutes.length > 0) {
    const localizedGroups = groupLlmsTxtRoutesByLocale(documentRoutes, projectConfig)
    for (const [locale, localeRoutes] of localizedGroups) {
      lines.push(`## ${llmsTxtDocsSectionTitle(locale, localizedGroups.size, projectConfig)}`)

      for (const route of localeRoutes) {
        const item = llmsTxtListItem(route, basePath)
        if (item) lines.push(item)
      }

      lines.push('')
    }
  }

  // Exclude bare alias routes (e.g., /path without language prefix) in multilingual sites
  const openApiRoutes = routes.filter(route => route.kind === 'openapi' && isLlmsTxtRoute(route) && !getContentRouteIsBareAlias(route))
  if (openApiRoutes.length > 0) {
    if (lines.at(-1) !== '') lines.push('')
    lines.push('## OpenAPI')
    for (const route of openApiRoutes) {
      const item = llmsTxtListItem(route, basePath)
      if (item) lines.push(item)
    }
  }

  while (lines.at(-1) === '') lines.pop()
  return `${lines.join('\n')}\n`
}

export function createLlmsTxtArtifact(routes: ContentRoute[], projectConfig: ResolvedProjectConfig): string {
  return withUtf8Signature(createLlmsTxt(routes, projectConfig))
}
