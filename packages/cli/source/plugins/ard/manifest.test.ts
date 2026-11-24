import { describe, expect, it } from 'vitest'

import { resolveProjectConfig } from '../../core/config/config.js'
import type { ClarifyArdConfig, ContentRoute, MarkdownContentRoute, OpenAPIContentRoute, ResolvedProjectConfig } from '../../types.js'

import { createArdManifest, createArdManifestUrl, hasArdEntries } from './manifest.js'

type RouteFixture = {
  path?: string
  title?: string
  description?: string
  updatedAt?: string
  artifactUrl?: string | null
  diagnostic?: ContentRoute['diagnostic']
  isBareAlias?: boolean
  version?: string
  content?: string
}

function openAPIRoute(overrides: RouteFixture = {}): OpenAPIContentRoute {
  const content = overrides.content ?? JSON.stringify({
    openapi: '3.1.0',
    info: { title: overrides.title ?? 'Payments API', version: overrides.version ?? '2.1.0' },
    paths: {},
  })

  return {
    path: overrides.path ?? '/payments',
    kind: 'openapi',
    meta: {
      title: overrides.title ?? 'Payments API',
      description: overrides.description,
      updatedAt: overrides.updatedAt,
    },
    module: { pageVirtualModuleId: 'virtual:clarify-page/payments' },
    source: { filePath: '/tmp/payments.openapi.json', content },
    artifacts: overrides.artifactUrl === null
      ? {}
      : { contentArtifactUrl: overrides.artifactUrl ?? '/payments.openapi.json' },
    diagnostic: overrides.diagnostic,
    isBareAlias: overrides.isBareAlias,
  }
}

function markdownRoute(path = '/guide'): MarkdownContentRoute {
  return {
    path,
    kind: 'markdown+jsx',
    meta: { title: 'Guide' },
    module: {
      pageVirtualModuleId: `virtual:clarify-page${path}`,
      contentVirtualModuleId: `virtual:clarify-content${path}.mdx`,
    },
    source: { filePath: `/tmp${path}.mdx`, content: '# Guide' },
    artifacts: { contentArtifactUrl: `${path}.md` },
  }
}

function config(ard: ClarifyArdConfig | boolean = true, overrides: Partial<ResolvedProjectConfig> = {}): ResolvedProjectConfig {
  const feature = typeof ard === 'boolean' ? ard : { ...ard, enabled: true }
  const resolved = resolveProjectConfig({
    siteUrl: 'https://docs.example.com',
    features: { ard: feature, search: false },
  })
  return { ...resolved, ...overrides }
}

describe('ARD manifest', () => {
  it('is enabled by default and can be disabled explicitly', () => {
    const projectConfig = resolveProjectConfig({ siteUrl: 'https://docs.example.com' })
    const routes = [openAPIRoute()]

    expect(projectConfig.features.ard.enabled).toBe(true)
    expect(hasArdEntries(routes, projectConfig)).toBe(true)

    const disabledConfig = resolveProjectConfig({ siteUrl: 'https://docs.example.com', features: { ard: false } })
    expect(disabledConfig.features.ard.enabled).toBe(false)
    expect(hasArdEntries(routes, disabledConfig)).toBe(false)
    expect(createArdManifest(routes, disabledConfig)).toBeUndefined()
  })

  it('requires siteUrl to build domain-anchored identifiers and absolute URLs', () => {
    const projectConfig = resolveProjectConfig({ features: { ard: true } })

    expect(createArdManifestUrl(projectConfig)).toBeUndefined()
    expect(createArdManifest([openAPIRoute()], projectConfig)).toBeUndefined()
  })

  it('adapts published OpenAPI routes without repeating discovery metadata', () => {
    const projectConfig = config()
    const manifest = createArdManifest([
      openAPIRoute({ description: 'Move money between accounts.', updatedAt: '2026-01-02T03:04:05.000Z' }),
    ], projectConfig)

    expect(manifest).toEqual({
      entries: [{
        '@context': 'https://agenticresourcediscovery.org/context/v1',
        '@id': 'urn:air:docs.example.com:openapi:root',
        identifier: 'urn:air:docs.example.com:openapi:root',
        displayName: 'Clarify Docs',
        type: 'application/vnd.oai.openapi+json',
        url: 'https://docs.example.com/openapi.json',
        tags: ['openapi'],
        capabilities: ['OpenAPI'],
        representativeQueries: [
          'What endpoints does Clarify Docs provide?',
          'Show me how to call Clarify Docs.',
        ],
        version: '2.1.0',
      }, {
        '@context': 'https://agenticresourcediscovery.org/context/v1',
        '@id': 'urn:air:docs.example.com:openapi:payments',
        identifier: 'urn:air:docs.example.com:openapi:payments',
        displayName: 'Payments API',
        type: 'application/vnd.oai.openapi+json',
        url: 'https://docs.example.com/payments.openapi.json',
        description: 'Move money between accounts.',
        tags: ['openapi'],
        capabilities: ['OpenAPI'],
        representativeQueries: [
          'What endpoints does Payments API provide?',
          'Show me how to call Payments API.',
        ],
        version: '2.1.0',
        updatedAt: '2026-01-02T03:04:05.000Z',
      }],
    })
  })

  it('never lists documentation pages that were not explicitly configured', () => {
    const projectConfig = config()
    const manifest = createArdManifest([markdownRoute('/guide')], projectConfig)

    expect(manifest).toBeUndefined()
    expect(hasArdEntries([markdownRoute('/guide')], projectConfig)).toBe(false)
  })

  it('keeps the aggregate entry but skips per-route artifacts, aliases, and diagnostics', () => {
    const projectConfig = config()
    const manifest = createArdManifest([
      openAPIRoute({ path: '/missing', artifactUrl: null }),
      openAPIRoute({ path: '/guide', isBareAlias: true }),
      openAPIRoute({ path: '/broken', diagnostic: { severity: 'error', code: 'invalid-openapi', message: 'Invalid' } as never }),
    ], projectConfig)

    expect(manifest?.entries.map(entry => entry.url)).toEqual(['https://docs.example.com/openapi.json'])
  })

  it('applies routePrefix to resource URLs', () => {
    const projectConfig = config(true, { routePrefix: '/docs/' })
    const manifest = createArdManifest([openAPIRoute()], projectConfig)

    expect(createArdManifestUrl(projectConfig)).toBe('https://docs.example.com/docs/.well-known/ard.json')
    expect(manifest?.entries.at(-1)?.url).toBe('https://docs.example.com/docs/payments.openapi.json')
  })

  it('publishes only explicitly configured resources with derived metadata', () => {
    const projectConfig = config({
      openapi: false,
      entries: [
        {
          url: '/mcp/server-card.json',
          description: 'Weather tools over MCP.',
          representativeQueries: ['what is the weather in Seattle'],
        },
        {
          identifier: 'urn:air:docs.example.com:registry:public',
          displayName: 'Clarify Registry',
          type: 'application/ai-registry+json',
          url: 'https://registry.example.com/api/',
          capabilities: ['Search'],
          metadata: { tier: 'public' },
        },
      ],
    })
    const manifest = createArdManifest([openAPIRoute(), markdownRoute()], projectConfig)

    expect(manifest).toEqual({
      entries: [
        {
          '@context': 'https://agenticresourcediscovery.org/context/v1',
          '@id': 'urn:air:docs.example.com:resource:server-card',
          identifier: 'urn:air:docs.example.com:resource:server-card',
          displayName: 'server-card',
          type: 'application/json',
          url: 'https://docs.example.com/mcp/server-card.json',
          description: 'Weather tools over MCP.',
          representativeQueries: ['what is the weather in Seattle'],
        },
        {
          '@context': 'https://agenticresourcediscovery.org/context/v1',
          '@id': 'urn:air:docs.example.com:registry:public',
          identifier: 'urn:air:docs.example.com:registry:public',
          displayName: 'Clarify Registry',
          type: 'application/ai-registry+json',
          url: 'https://registry.example.com/api/',
          capabilities: ['Search'],
          representativeQueries: [
            'What does Clarify Registry provide?',
            'How do I use Clarify Registry?',
          ],
          metadata: { tier: 'public' },
        },
      ],
    })
  })

  it('keeps OpenAPI entries and configured entries without duplicate URLs', () => {
    const projectConfig = config({
      entries: [{ displayName: 'Payments', url: '/payments.openapi.json' }],
    })
    const manifest = createArdManifest([openAPIRoute()], projectConfig)

    expect(manifest?.entries.map(entry => entry.displayName)).toEqual(['Clarify Docs', 'Payments API'])
  })

  it('rejects duplicate explicit identifiers', () => {
    const duplicate = 'urn:air:docs.example.com:resource:shared'
    const projectConfig = config({
      openapi: false,
      entries: [
        { identifier: duplicate, displayName: 'A', url: '/a.json' },
        { identifier: duplicate, displayName: 'B', url: '/b.json' },
      ],
    })

    expect(() => createArdManifest([], projectConfig)).toThrow('duplicate ARD identifier')
  })

  it('derives unique identifiers when route paths normalize to the same segment', () => {
    const projectConfig = config()
    const manifest = createArdManifest([
      openAPIRoute({ path: '/payments', artifactUrl: '/payments.openapi.json' }),
      openAPIRoute({ path: '/payments/', artifactUrl: '/payments/index.openapi.json' }),
    ], projectConfig)

    expect(manifest?.entries.map(entry => entry.identifier)).toEqual([
      'urn:air:docs.example.com:openapi:root',
      'urn:air:docs.example.com:openapi:payments',
      'urn:air:docs.example.com:openapi:payments-2',
    ])
  })

  it('uses the site title when a route has no title', () => {
    const projectConfig = config()
    const route = openAPIRoute({ title: '' })
    route.meta.title = ''
    const manifest = createArdManifest([route], projectConfig)

    expect(manifest?.entries.at(-1)?.displayName).toBe('Clarify Docs')
  })

  it('reports configured entries even when no OpenAPI routes are published', () => {
    const projectConfig = config({ entries: [{ displayName: 'MCP', url: '/mcp.json' }] })
    const emptyConfig = resolveProjectConfig({ siteUrl: 'https://docs.example.com', features: { ard: true, search: false } })

    expect(hasArdEntries([], projectConfig)).toBe(true)
    expect(hasArdEntries([], emptyConfig)).toBe(false)
  })

  it('lists the MCP search descriptor when the search feature is enabled', () => {
    const projectConfig = resolveProjectConfig({ siteUrl: 'https://docs.example.com' })
    const manifest = createArdManifest([], projectConfig)

    expect(manifest).toEqual({
      entries: [{
        '@context': 'https://agenticresourcediscovery.org/context/v1',
        '@id': 'urn:air:docs.example.com:mcp:documentation-search',
        identifier: 'urn:air:docs.example.com:mcp:documentation-search',
        displayName: 'Clarify Docs MCP documentation search',
        type: 'application/json',
        url: 'https://docs.example.com/mcp.json',
        description: 'Search the Clarify Docs documentation over the Model Context Protocol.',
        tags: ['mcp', 'search'],
        capabilities: ['DocumentSearch'],
        representativeQueries: [
          'How do I search the Clarify Docs documentation?',
          'What documentation does Clarify Docs provide?',
        ],
        metadata: {
          protocol: 'mcp',
          transport: 'stdio',
          server: {
            command: 'npx',
            args: ['@clarify-labs/cli', 'mcp', 'https://docs.example.com'],
          },
          descriptorVersion: 3,
          indexPath: 'https://docs.example.com/mcp-search.msp',
        },
      }],
    })
  })

  it('keeps mcp.json at the site root when routePrefix is set', () => {
    const projectConfig = resolveProjectConfig({
      siteUrl: 'https://docs.example.com',
      routePrefix: '/docs/',
    })
    const entry = createArdManifest([], projectConfig)?.entries[0]

    expect(entry?.url).toBe('https://docs.example.com/mcp.json')
    expect(entry?.metadata?.indexPath).toBe('https://docs.example.com/docs/mcp-search.msp')
  })

  it('omits the MCP entry when search or ARD MCP output is disabled', () => {
    const noSearch = resolveProjectConfig({
      siteUrl: 'https://docs.example.com',
      features: { search: false },
    })
    const noArdMcp = resolveProjectConfig({
      siteUrl: 'https://docs.example.com',
      features: { ard: { mcp: false } },
    })

    expect(createArdManifest([], noSearch)).toBeUndefined()
    expect(createArdManifest([], noArdMcp)).toBeUndefined()
  })

  it('applies the default trust manifest unless an entry defines its own', () => {
    const projectConfig = config({
      trustManifest: { identity: 'https://docs.example.com/trust.json' },
      entries: [{
        displayName: 'Custom',
        url: '/custom.json',
        trustManifest: { identity: 'https://docs.example.com/custom.json' },
      }],
    })
    const manifest = createArdManifest([openAPIRoute()], projectConfig)

    expect(manifest?.entries.map(entry => entry.trustManifest)).toEqual([
      { identity: 'https://docs.example.com/trust.json' },
      { identity: 'https://docs.example.com/trust.json' },
      { identity: 'https://docs.example.com/custom.json' },
    ])
  })

  it('publishes inline data with trust metadata and extension terms', () => {
    const identifier = 'urn:air:docs.example.com:skill:weather'
    const projectConfig = config({
      openapi: false,
      entries: [{
        identifier,
        displayName: 'Weather Skill',
        data: { name: 'weather', version: 1 },
        capabilities: ['WeatherTool'],
        trustManifest: { identity: 'https://docs.example.com' },
        context: { acme: 'https://acme.example.com/vocab#' },
        terms: { 'acme:serviceTier': 'enterprise' },
      }],
    })
    const manifest = createArdManifest([], projectConfig)

    expect(manifest).toEqual({
      entries: [{
        'acme:serviceTier': 'enterprise',
        '@context': [
          'https://agenticresourcediscovery.org/context/v1',
          { acme: 'https://acme.example.com/vocab#' },
        ],
        '@id': identifier,
        identifier,
        displayName: 'Weather Skill',
        type: 'application/json',
        data: { name: 'weather', version: 1 },
        capabilities: ['WeatherTool'],
        representativeQueries: [
          'What does Weather Skill provide?',
          'How do I use Weather Skill?',
        ],
        trustManifest: { identity: 'https://docs.example.com' },
      }],
    })
  })
})
