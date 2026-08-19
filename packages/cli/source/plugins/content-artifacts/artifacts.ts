import type { ContentRoute, OpenAPISpec, ResolvedProjectConfig } from '../../types.js'

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

function mergeOpenAPIRecord(target: Record<string, unknown>, source: Record<string, unknown> | undefined, section: string, filePath: string): void {
  if (!source) return

  for (const [key, value] of Object.entries(source)) {
    const existing = target[key]
    if (existing !== undefined && JSON.stringify(existing) !== JSON.stringify(value)) {
      throw new Error(`[clarify] Cannot aggregate OpenAPI specs: conflicting ${section} entry "${key}" in ${filePath}.`)
    }
    target[key] = value
  }
}

function rootOpenAPIRoutes(routes: ContentRoute[], projectConfig: ResolvedProjectConfig): ContentRoute[] {
  const defaultLocale = projectConfig.locales?.default
  const routesBySource = new Map<string, ContentRoute>()

  for (const route of routes) {
    if (
      route.kind !== 'openapi' ||
      route.diagnostic ||
      !route.source.content ||
      route.openapi?.tagFilter?.length ||
      route.isBareAlias ||
      (defaultLocale && route.locale && route.locale !== defaultLocale)
    ) continue

    routesBySource.set(route.source.filePath, route)
  }

  return [...routesBySource.values()]
}

function openAPIVersionFamily(version: string): string {
  return version.split('.').slice(0, 2).join('.')
}

const OPENAPI_OPERATION_METHODS = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'])

function sourceComponentPrefix(route: ContentRoute): string {
  const sourceName = route.openapi?.sourceSpecId ?? route.source.filePath.split(/[\\/]/).pop()?.replace(/\.openapi\.(?:json|ya?ml)$/i, '') ?? 'service'
  return sourceName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'service'
}

function securitySchemeNameMap(route: ContentRoute, sourceSchemes: Record<string, unknown>, targetSchemes: Record<string, unknown>): Map<string, string> {
  const names = new Map<string, string>()

  for (const [name, definition] of Object.entries(sourceSchemes)) {
    const existing = targetSchemes[name]
    if (existing === undefined || JSON.stringify(existing) === JSON.stringify(definition)) {
      targetSchemes[name] = definition
      names.set(name, name)
      continue
    }

    const prefix = sourceComponentPrefix(route)
    let candidate = `${prefix}__${name}`
    let suffix = 2
    while (targetSchemes[candidate] !== undefined && JSON.stringify(targetSchemes[candidate]) !== JSON.stringify(definition)) {
      candidate = `${prefix}__${name}_${suffix++}`
    }
    targetSchemes[candidate] = definition
    names.set(name, candidate)
  }

  return names
}

function rewriteSecurityRequirements(value: unknown, schemeNames: Map<string, string>): unknown {
  if (!Array.isArray(value)) return value
  return value.map((requirement) => {
    if (!requirement || typeof requirement !== 'object' || Array.isArray(requirement)) return requirement
    return Object.fromEntries(Object.entries(requirement).map(([name, scopes]) => [schemeNames.get(name) ?? name, scopes]))
  })
}

function localizePathItemContext(pathItemValue: unknown, documentServers: unknown, documentSecurity: unknown, hasDocumentSecurity: boolean, schemeNames: Map<string, string>): unknown {
  if (!pathItemValue || typeof pathItemValue !== 'object' || Array.isArray(pathItemValue)) return pathItemValue
  const pathItem = structuredClone(pathItemValue) as Record<string, unknown>
  const pathServers = Object.hasOwn(pathItem, 'servers') ? pathItem.servers : documentServers

  for (const [method, operationValue] of Object.entries(pathItem)) {
    if (!OPENAPI_OPERATION_METHODS.has(method) || !operationValue || typeof operationValue !== 'object' || Array.isArray(operationValue)) continue
    const operation = operationValue as Record<string, unknown>

    if (!Object.hasOwn(operation, 'servers') && pathServers !== undefined) operation.servers = structuredClone(pathServers)
    if (Object.hasOwn(operation, 'security')) {
      operation.security = rewriteSecurityRequirements(operation.security, schemeNames)
    }
    else if (hasDocumentSecurity) {
      operation.security = rewriteSecurityRequirements(structuredClone(documentSecurity), schemeNames)
    }
  }

  delete pathItem.servers
  return pathItem
}

function localizeOpenAPIContexts(spec: OpenAPISpec, schemeNames: Map<string, string>): { paths: Record<string, unknown>, webhooks?: Record<string, unknown> } {
  const document = spec as unknown as Record<string, unknown>
  const hasDocumentSecurity = Object.hasOwn(document, 'security')
  const localizeEntries = (entries: Record<string, unknown> | undefined): Record<string, unknown> | undefined => entries && Object.fromEntries(
    Object.entries(entries).map(([name, pathItem]) => [name, localizePathItemContext(pathItem, document.servers, document.security, hasDocumentSecurity, schemeNames)]),
  )

  return {
    paths: localizeEntries(spec.paths as Record<string, unknown>) ?? {},
    webhooks: localizeEntries('webhooks' in spec ? spec.webhooks as Record<string, unknown> : undefined),
  }
}

export function createRootOpenAPISpec(routes: ContentRoute[], projectConfig: ResolvedProjectConfig): OpenAPISpec {
  const paths: Record<string, unknown> = {}
  const webhooks: Record<string, unknown> = {}
  const components: Record<string, Record<string, unknown>> = {}
  const tags = new Map<string, unknown>()
  let openapiVersion: string | undefined

  for (const route of rootOpenAPIRoutes(routes, projectConfig)) {
    const filePath = route.source.filePath
    const spec = JSON.parse(route.source.content!) as OpenAPISpec

    if (openapiVersion && openAPIVersionFamily(openapiVersion) !== openAPIVersionFamily(spec.openapi)) {
      throw new Error(`[clarify] Cannot aggregate OpenAPI specs: incompatible versions "${openapiVersion}" and "${spec.openapi}" in ${filePath}.`)
    }
    openapiVersion ??= spec.openapi

    components.securitySchemes ??= {}
    const sourceComponents = spec.components as Record<string, Record<string, unknown>> | undefined
    const schemeNames = securitySchemeNameMap(route, sourceComponents?.securitySchemes ?? {}, components.securitySchemes)
    const localized = localizeOpenAPIContexts(spec, schemeNames)
    mergeOpenAPIRecord(paths, localized.paths, 'paths', filePath)
    mergeOpenAPIRecord(webhooks, localized.webhooks, 'webhooks', filePath)

    for (const [section, entries] of Object.entries(sourceComponents ?? {})) {
      if (section === 'securitySchemes') continue
      components[section] ??= {}
      mergeOpenAPIRecord(components[section], entries, `components.${section}`, filePath)
    }

    for (const tag of spec.tags ?? []) {
      const existing = tags.get(tag.name)
      if (existing !== undefined && JSON.stringify(existing) !== JSON.stringify(tag)) {
        throw new Error(`[clarify] Cannot aggregate OpenAPI specs: conflicting tag "${tag.name}" in ${filePath}.`)
      }
      tags.set(tag.name, tag)
    }
  }

  if (Object.keys(components.securitySchemes).length === 0) delete components.securitySchemes

  return {
    openapi: openapiVersion ?? '3.1.0',
    info: {
      title: projectConfig.title,
      description: projectConfig.description,
      version: '1.0.0',
    },
    paths,
    ...(Object.keys(webhooks).length > 0 ? { webhooks } : {}),
    ...(Object.keys(components).length > 0 ? { components } : {}),
    ...(tags.size > 0 ? { tags: [...tags.values()] } : {}),
  } as OpenAPISpec
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
