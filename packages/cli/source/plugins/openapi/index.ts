import { relative } from 'node:path'

import { getProjectContentProcessor } from '../../core/content.js'
import { localizedRoutePath, openAPIPagePathFromRef, withAlternates } from '../../parsers/routes.js'
import type { ClarifyPagesConfig, ClarifyPagesItem, ClarifyPlugin, ContentRoute, OpenAPISpec, ResolvedProjectConfig } from '../../types.js'

import { extractOpenAPISections, filterSpecByTags, findOpenAPIRoutes, readOpenAPISpec } from './parser.js'
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
        openapiTagFilter: tagFilter?.length ? tagFilter : undefined,
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
            route.diagnostic = result.diagnostic
            route.title = route.title || 'OpenAPI parse error'
            route.sections = []
            continue
          }

          const spec = result.spec
          specByFilePath.set(route.filePath, spec)

          // Derive a stable dedup key from the spec file path
          const specKey = specFileKeyFromPath(route.filePath, ctx.generateOptions.projectRoot)
          route.specFileKey = specKey

          specs.set(specKey, { spec, filePath: route.filePath })
          route.title = spec.info?.title ?? route.title
          route.description = spec.info?.description ?? route.description
          route.sections = extractOpenAPISections(spec, route.openapiTagFilter)

          // Set route.content to filtered or full JSON for the content-artifacts plugin
          const pageSpec = route.openapiTagFilter?.length
            ? filterSpecByTags(spec, route.openapiTagFilter)
            : spec
          route.content = JSON.stringify(pageSpec)
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
          if (route.kind !== 'openapi' || !route.specFileKey) continue
          const spec = specs.get(route.specFileKey)?.spec
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
          if (route.diagnostic) {
            modules.set(route.virtualModuleId, generateOpenAPIErrorModule(route.diagnostic))
          } else if (route.specFileKey) {
            const entry = specs.get(route.specFileKey)
            if (!entry) continue

            modules.set(route.virtualModuleId, generateOpenAPIPageModule({
              spec: entry.spec,
              tagFilter: route.openapiTagFilter,
            }))
          }
        }

        return modules
      },
    },
  }
}
