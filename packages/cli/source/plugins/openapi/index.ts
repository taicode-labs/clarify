import { relative } from 'node:path'

import type { ContentDocument } from '@clarify-labs/renderer'

import { getProjectContentProcessor } from '../../core/content/index.js'
import { createContentDocument, syncContentDocumentRoute } from '../../parsers/content/content-document.js'
import { createOpenAPIContentDocument } from '../../parsers/openapi/content-document.js'
import { extractOpenAPISections, filterSpecByTags, findOpenAPIRoutes, readOpenAPISpec } from '../../parsers/openapi/index.js'
import { localizedRoutePath, openAPIPagePathFromRef, withAlternates } from '../../parsers/router/index.js'
import type { ClarifyPagesConfig, ClarifyPagesItem, ClarifyPlugin, ContentRoute, OpenAPISpec, ResolvedProjectConfig } from '../../types.js'

import { generateOpenAPIErrorModule, generateOpenAPIPageModule, generateOpenAPIRegistryModule, generateOpenAPISpecModule, openApiRegistryModuleId, specVirtualModuleId } from './virtual-modules.js'

type OpenAPISpecEntry = {
  spec: OpenAPISpec
  /** Source spec file path – used as deduplication key across routes. */
  filePath: string
}

function collectOpenAPIPageItems(config: ResolvedProjectConfig): Array<Extract<ClarifyPagesItem, { openapi: string }>> {
  const items: Array<Extract<ClarifyPagesItem, { openapi: string }>> = []

  function visitPages(pages?: ClarifyPagesConfig) {
    if (!pages || pages === 'FileTree') return
    for (const group of pages) {
      for (const item of group.pages) {
        if (typeof item !== 'string' && 'openapi' in item && (item.path || item.filter?.tags?.length)) items.push(item)
      }
    }
  }

  for (const tab of config.tabs ?? []) visitPages(tab.pages)

  return items
}

function virtualModuleIdFromPath(path: string): string {
  return `virtual:clarify-page/${path.replace(/^\/+/, '') || 'index'}`
}

function createConfiguredOpenAPIRoutes(routes: ContentRoute[], config: ResolvedProjectConfig): ContentRoute[] {
  const pageItems = collectOpenAPIPageItems(config)
  if (!pageItems.length) return routes

  const additions: ContentRoute[] = []
  const existingKeys = new Set(routes.map(route => `${route.locale ?? ''}:${route.basePath ?? route.path}`))

  for (const item of pageItems) {
    const tagFilter = item.filter?.tags?.filter(Boolean)
    const sourceBasePath = openAPIPagePathFromRef(item.openapi)
    const targetBasePath = openAPIPagePathFromRef(item.openapi, tagFilter, item.path)
    if (sourceBasePath === targetBasePath && !tagFilter?.length) continue

    for (const route of routes) {
      if (route.kind !== 'openapi' || (route.basePath ?? route.path) !== sourceBasePath) continue

      const key = `${route.locale ?? ''}:${targetBasePath}`
      if (existingKeys.has(key)) continue
      existingKeys.add(key)

      additions.push({
        ...route,
        path: route.locale && config.i18n ? localizedRoutePath(targetBasePath, route.locale, config.i18n) : targetBasePath,
        basePath: targetBasePath,
        title: route.title,
        virtualModuleId: virtualModuleIdFromPath(targetBasePath),
        openapi: {
          ...route.openapi,
          tagFilter: tagFilter?.length ? tagFilter : undefined,
        },
      })
    }
  }

  const nextRoutes = [...routes, ...additions]
  return config.i18n ? nextRoutes.map(route => withAlternates(route, nextRoutes, config.i18n!)) : nextRoutes
}

/** Derive a stable, deduplicated key from an absolute spec file path. */
function specFileKeyFromPath(filePath: string, projectRoot: string): string {
  return relative(projectRoot, filePath).replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
}

function buildOpenAPIContentDocument(route: ContentRoute, spec: OpenAPISpec, specFileKey: string, metadata: ContentDocument['metadata'] = {}): ContentDocument {
  return createOpenAPIContentDocument(route, spec, specFileKey, metadata)
}

export function createOpenAPIPlugin(): ClarifyPlugin {
  /** specs keyed by specFileKey (deduplicated per source file). */
  const specs = new Map<string, OpenAPISpecEntry>()

  return {
    name: 'clarify:openapi',
    hooks: {
      'routes:discover': (input) => ({
        ...input,
        routes: [...input.routes, ...findOpenAPIRoutes(input.contentRoot)],
      }),
      'routes:discovered': async (routes, ctx) => {
        specs.clear()

        const nextRoutes = createConfiguredOpenAPIRoutes(routes, ctx.projectConfig)
        const specByFilePath = new Map<string, OpenAPISpec>()

        for (const route of nextRoutes.filter(route => route.kind === 'openapi')) {
          const specFromCache = specByFilePath.get(route.filePath)
          const result = specFromCache ? { ok: true as const, spec: specFromCache } : await readOpenAPISpec(route.filePath, getProjectContentProcessor(ctx))
          if (!result.ok) {
            route.document = createContentDocument({ path: route.path, title: route.title, filePath: route.filePath, kind: route.kind, basePath: route.basePath, locale: route.locale, isFallback: route.isFallback, isBareAlias: route.isBareAlias, alternates: route.alternates, virtualModuleId: route.virtualModuleId }, [], { diagnostic: result.diagnostic })
            route.title = route.title || 'OpenAPI parse error'
            route.document = syncContentDocumentRoute(route)
            continue
          }

          const spec = result.spec
          const pageSpec = route.openapi?.tagFilter?.length ? filterSpecByTags(spec, route.openapi.tagFilter) : spec
          const sections = extractOpenAPISections(pageSpec, route.openapi?.tagFilter)
          specByFilePath.set(route.filePath, spec)

          // Derive a stable dedup key from the spec file path
          const specKey = specFileKeyFromPath(route.filePath, ctx.generateOptions.projectRoot)
          route.openapi = {
            ...route.openapi,
            specFileKey: specKey,
            tagFilter: route.openapi?.tagFilter,
          }

          specs.set(specKey, { spec, filePath: route.filePath })
          route.title = spec.info?.title ?? route.title
          route.document = syncContentDocumentRoute(route)
          route.source = {
            ...route.source,
            content: JSON.stringify(pageSpec),
          }
          route.document = buildOpenAPIContentDocument(route, pageSpec, specKey, {
            description: spec.info?.description ?? undefined,
            sections,
          })
          route.document = syncContentDocumentRoute(route)
          route.openapi = {
            ...route.openapi,
            tagFilter: route.openapi?.tagFilter,
            spec: pageSpec,
          }
        }

        return nextRoutes
      },
      'modules:before': (modules, ctx) => {
        // ── Registry module (used by SSR to populate OpenApisContext) ──
        // Keys are unified in namespace 3 (virtual:clarify-page/…)
        // so both page modules and embedded components (useOpenApiSpec)
        // look up specs the same way.
        const registryEntries: Record<string, OpenAPISpec> = {}

        for (const route of ctx.routes) {
          if (route.kind !== 'openapi' || !route.openapi?.specFileKey) continue
          const spec = specs.get(route.openapi.specFileKey)?.spec
          if (!spec) continue

          const base = (route.basePath ?? route.path).replace(/^\//, '')

          // Always use an explicit locale-prefixed key so no two routes
          // can overwrite each other.  Falls back to bare path only when
          // i18n is disabled (no locale on the route).
          const registryKey = route.locale
            ? `virtual:clarify-page/${route.locale}/${base}`
            : `virtual:clarify-page/${base}`
          registryEntries[registryKey] = spec
        }

        modules.set(openApiRegistryModuleId, generateOpenAPIRegistryModule(registryEntries))

        // ── Per-spec virtual modules (lazy-loaded by page modules at runtime) ──
        for (const [specKey, entry] of specs) {
          modules.set(specVirtualModuleId(specKey), generateOpenAPISpecModule(entry.spec))
        }

        // ── Per-route page modules ──
        for (const route of ctx.routes) {
          if (route.kind !== 'openapi') continue
          if (route.document?.metadata.diagnostic) {
            modules.set(route.virtualModuleId, generateOpenAPIErrorModule(route.document.metadata.diagnostic))
          } else if (route.openapi?.specFileKey) {
            const entry = specs.get(route.openapi.specFileKey)
            if (!entry) continue

            modules.set(route.virtualModuleId, generateOpenAPIPageModule({
              spec: entry.spec,
              tagFilter: route.openapi?.tagFilter,
              contentDocument: route.document,
            }))
          }
        }

        return modules
      },
    },
  }
}
