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
  if (route.kind === 'markdown+jsx' || route.kind === 'markdown') return true
  return false
}

function routeToMarkdownArtifactUrl(routePath: string): string {
  const normalizedPath = routePath === '/' ? '/index' : routePath.replace(/\/$/, '')
  return `${normalizedPath}.md`
}

function routeToOpenAPIArtifactUrl(routePath: string): string {
  const normalizedPath = routePath === '/' ? '/index' : routePath.replace(/\/$/, '')
  return `${normalizedPath}.openapi.json`
}

export function attachContentArtifactUrls(routes: ContentRoute[]): void {
  for (const route of routes) {
    route.artifacts = {
      ...route.artifacts,
      contentArtifactUrl: route.kind === 'openapi'
        ? routeToOpenAPIArtifactUrl(route.path)
        : routeToMarkdownArtifactUrl(route.path),
    }
  }
}

export function readRouteContent(route: ContentRoute): string {
  if (route.source.content !== undefined) return route.source.content
  throw new Error(`Route content is missing from route context: ${route.source.filePath}`)
}

export function readRouteArtifactContent(route: ContentRoute): string {
  const content = readRouteContent(route)
  return shouldUseUtf8Signature(route) ? withUtf8Signature(content) : content
}

function isLlmsTxtRoute(route: ContentRoute): boolean {
  return !route.path.split('/').includes('404')
}

function llmsTxtDescription(route: ContentRoute): string | undefined {
  if (route.meta.description) return route.meta.description

  const sections = route.meta.sections?.filter(section => section.level === 2).slice(0, 3).map(section => section.title)
  if (sections?.length) return `Covers ${sections.join(', ')}.`

  if (route.meta.keywords?.length) return `Related topics: ${route.meta.keywords.join(', ')}.`

  if (route.kind === 'openapi') return 'OpenAPI artifact for machine-readable API reference data.'

  return undefined
}

function llmsTxtListItem(route: ContentRoute, basePath: string): string | undefined {
  const contentArtifactUrl = route.artifacts?.contentArtifactUrl
  if (!contentArtifactUrl) return undefined

  const description = llmsTxtDescription(route)
  return description
    ? `- [${route.meta.title}](${basePath}${contentArtifactUrl}): ${description}`
    : `- [${route.meta.title}](${basePath}${contentArtifactUrl})`
}

function llmsTxtLocaleLabel(locale: string, projectConfig: ResolvedProjectConfig): string {
  return projectConfig.locales?.locales.find(item => item.code === locale)?.label ?? locale
}

function groupRoutesByLocale(routes: ContentRoute[]): Map<string, ContentRoute[]> {
  const groups = new Map<string, ContentRoute[]>()
  for (const route of routes) {
    const key = route.locale ?? 'default'
    groups.set(key, [...(groups.get(key) ?? []), route])
  }
  return groups
}

function groupLlmsTxtRoutesByLocale(routes: ContentRoute[], projectConfig: ResolvedProjectConfig): Map<string, ContentRoute[]> {
  const routesBySource = new Map<string, ContentRoute>()
  const defaultLocale = projectConfig.locales?.default

  for (const route of routes) {
    const sourceKey = `${route.locale ?? defaultLocale ?? 'default'}:${route.basePath ?? route.artifacts?.contentArtifactUrl ?? route.path}`
    const previousRoute = routesBySource.get(sourceKey)

    if (!previousRoute || (previousRoute.locale && !route.locale)) {
      routesBySource.set(sourceKey, route)
    }
  }

  return groupRoutesByLocale([...routesBySource.values()].map(route => ({
    ...route,
    locale: route.locale ?? defaultLocale,
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
  const markdownRoutes = routes.filter(route => (route.kind === 'markdown+jsx' || route.kind === 'markdown') && isLlmsTxtRoute(route) && !route.isBareAlias)
  if (markdownRoutes.length > 0) {
    const localizedGroups = groupLlmsTxtRoutesByLocale(markdownRoutes, projectConfig)
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
  const openApiRoutes = routes.filter(route => route.kind === 'openapi' && isLlmsTxtRoute(route) && !route.isBareAlias)
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
