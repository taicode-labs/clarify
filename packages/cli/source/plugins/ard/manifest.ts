import type { ClarifyArdEntryConfig, ContentRoute, ResolvedProjectConfig } from '../../types.js'

export const ARD_CONTEXT_URL = 'https://agenticresourcediscovery.org/context/v1'
export const ARD_MANIFEST_FILE_NAME = '.well-known/ard.json'

const OPENAPI_ARTIFACT_TYPE = 'application/vnd.oai.openapi+json'
const DEFAULT_ARTIFACT_TYPE = 'application/json'
const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+.-]*:\/\//i

export type ArdEntry = {
  '@context'?: string
  identifier: string
  displayName: string
  type: string
  url: string
  description?: string
  tags?: string[]
  capabilities?: string[]
  representativeQueries?: string[]
  version?: string
  updatedAt?: string
  metadata?: Record<string, unknown>
}

export type ArdManifest = {
  entries: ArdEntry[]
}

function normalizeRoutePrefix(routePrefix: string): string {
  if (!routePrefix || routePrefix === '/') return ''
  return `/${routePrefix.replace(/^\/+|\/+$/g, '')}`
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function toPublicUrl(config: ResolvedProjectConfig, value: string): string {
  if (ABSOLUTE_URL_PATTERN.test(value)) return value
  const path = value.startsWith('/') ? value : `/${value}`
  return `${trimTrailingSlash(config.siteUrl!)}${normalizeRoutePrefix(config.routePrefix)}${path}`
}

function identifierSegment(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function uniqueIdentifier(publisher: string, namespace: string, name: string, used: Set<string>): string {
  const base = `urn:air:${publisher}:${namespace}:${name || 'resource'}`
  let identifier = base
  let suffix = 2
  while (used.has(identifier)) {
    identifier = `${base}-${suffix}`
    suffix += 1
  }
  used.add(identifier)
  return identifier
}

function explicitIdentifier(value: string, used: Set<string>): string {
  if (used.has(value)) throw new Error(`[clarify] duplicate ARD identifier: ${value}`)
  used.add(value)
  return value
}

function displayNameFromUrl(url: string): string {
  const pathname = url.split(/[?#]/, 1)[0] ?? url
  const segments = pathname.split('/').filter(Boolean)
  const lastSegment = segments.at(-1)
  if (!lastSegment) return url
  const withoutExtension = lastSegment.replace(/\.[^./]+$/, '')
  return withoutExtension || lastSegment
}

const specVersionCache = new WeakMap<ContentRoute, string | undefined>()

function readSpecVersion(route: ContentRoute): string | undefined {
  if (specVersionCache.has(route)) return specVersionCache.get(route)

  let version: string | undefined
  if (route.source.content) {
    try {
      const spec = JSON.parse(route.source.content) as { info?: { version?: unknown } }
      if (typeof spec.info?.version === 'string' && spec.info.version) version = spec.info.version
    } catch {
      version = undefined
    }
  }

  specVersionCache.set(route, version)
  return version
}

function openAPIQueries(title: string): string[] {
  return [
    `What endpoints does ${title} provide?`,
    `Show me how to call ${title}.`,
  ]
}

function createOpenAPIEntry(route: ContentRoute, config: ResolvedProjectConfig, publisher: string, usedIdentifiers: Set<string>): ArdEntry | undefined {
  const contentArtifactUrl = route.artifacts?.contentArtifactUrl
  if (!contentArtifactUrl) return undefined

  const title = route.meta.title || config.title
  const version = readSpecVersion(route)
  const name = identifierSegment(route.path) || identifierSegment(title)

  const entry: ArdEntry = {
    '@context': ARD_CONTEXT_URL,
    identifier: uniqueIdentifier(publisher, 'openapi', name, usedIdentifiers),
    displayName: title,
    type: OPENAPI_ARTIFACT_TYPE,
    url: toPublicUrl(config, contentArtifactUrl),
    tags: ['openapi'],
    capabilities: ['OpenAPI'],
    representativeQueries: openAPIQueries(title),
  }
  if (route.meta.description) entry.description = route.meta.description
  if (route.meta.updatedAt) entry.updatedAt = route.meta.updatedAt
  if (version) entry.version = version
  return entry
}

function createConfiguredEntry(entry: ClarifyArdEntryConfig, config: ResolvedProjectConfig, publisher: string, usedIdentifiers: Set<string>): ArdEntry {
  const url = toPublicUrl(config, entry.url)
  const displayName = entry.displayName ?? displayNameFromUrl(url)
  const result: ArdEntry = {
    '@context': ARD_CONTEXT_URL,
    identifier: entry.identifier
      ? explicitIdentifier(entry.identifier, usedIdentifiers)
      : uniqueIdentifier(publisher, 'resource', identifierSegment(displayName), usedIdentifiers),
    displayName,
    type: entry.type ?? DEFAULT_ARTIFACT_TYPE,
    url,
  }
  if (entry.description) result.description = entry.description
  if (entry.tags) result.tags = entry.tags
  if (entry.capabilities) result.capabilities = entry.capabilities
  if (entry.representativeQueries) result.representativeQueries = entry.representativeQueries
  if (entry.version) result.version = entry.version
  if (entry.updatedAt) result.updatedAt = entry.updatedAt
  if (entry.metadata) result.metadata = entry.metadata
  return result
}

export function createArdManifestUrl(config: ResolvedProjectConfig): string | undefined {
  if (!config.siteUrl) return undefined
  return `${trimTrailingSlash(config.siteUrl)}${normalizeRoutePrefix(config.routePrefix)}/${ARD_MANIFEST_FILE_NAME}`
}

export function hasArdEntries(routes: ContentRoute[], config: ResolvedProjectConfig): boolean {
  if (!config.features.ard.enabled || !config.siteUrl) return false
  if (config.features.ard.entries.length > 0) return true
  if (!config.features.ard.openapi) return false
  return routes.some(route => route.kind === 'openapi' && !route.diagnostic && !route.isBareAlias && Boolean(route.artifacts?.contentArtifactUrl))
}

export function createArdManifest(routes: ContentRoute[], config: ResolvedProjectConfig): ArdManifest | undefined {
  if (!hasArdEntries(routes, config)) return undefined

  const publisher = new URL(config.siteUrl!).hostname
  const usedIdentifiers = new Set<string>()
  const usedUrls = new Set<string>()
  const entries: ArdEntry[] = []

  function pushEntry(entry: ArdEntry | undefined): void {
    if (!entry || usedUrls.has(entry.url)) return
    usedUrls.add(entry.url)
    entries.push(entry)
  }

  if (config.features.ard.openapi) {
    for (const route of routes) {
      if (route.kind !== 'openapi' || route.diagnostic || route.isBareAlias) continue
      pushEntry(createOpenAPIEntry(route, config, publisher, usedIdentifiers))
    }
  }

  for (const entry of config.features.ard.entries) {
    pushEntry(createConfiguredEntry(entry, config, publisher, usedIdentifiers))
  }

  return entries.length > 0 ? { entries } : undefined
}
