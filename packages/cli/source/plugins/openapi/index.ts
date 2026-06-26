import { relative } from 'node:path'

import { localizedRoutePath, openAPIPagePathFromRef } from '../../parsers/routes.js'
import type { ClarifyPagesConfig, ClarifyPagesItem, ClarifyPlugin, ContentRoute, OpenAPISpec, ResolvedClarifyI18nConfig, ResolvedProjectConfig } from '../../types.js'

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

function withAlternates(route: ContentRoute, routes: ContentRoute[], i18n: ResolvedClarifyI18nConfig): ContentRoute {
  const basePath = route.basePath ?? route.path
  const routeByLocaleAndBase = new Map(routes.map(route => [`${route.locale ?? ''}:${route.basePath ?? route.path}`, route]))
  const alternates = Object.fromEntries(
    i18n.locales.flatMap((locale) => {
      const alternate = routeByLocaleAndBase.get(`${locale.code}:${basePath}`)
      return alternate ? [[locale.code, alternate.path]] : []
    })
  )
  return { ...route, alternates }
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
          const result = specFromCache ? { ok: true as const, spec: specFromCache } : await readOpenAPISpec(route.filePath)
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
        const registryEntries: Record<string, OpenAPISpec> = {}
        for (const [specKey, entry] of specs) {
          registryEntries[specKey] = entry.spec
        }
        modules.set(openApiRegistryModuleId, generateOpenAPIRegistryModule(registryEntries))

        // ── Per-spec virtual modules (lazy-loaded by page modules at runtime) ──
        for (const [specKey, entry] of specs) {
          modules.set(specVirtualModuleId(specKey), generateOpenAPISpecModule(entry.spec))
        }

        // ── Per-route page modules ──
        for (const route of ctx.routes.filter(r => r.kind === 'openapi' && !r.diagnostic && r.specFileKey)) {
          modules.set(route.virtualModuleId, generateOpenAPIPageModule({
            specKey: route.specFileKey!,
            tagFilter: route.openapiTagFilter,
          }))
        }

        // Error modules for broken openapi routes
        for (const route of ctx.routes.filter(r => r.kind === 'openapi' && r.diagnostic)) {
          if (route.diagnostic) modules.set(route.virtualModuleId, generateOpenAPIErrorModule(route.diagnostic))
        }

        return modules
      },
    },
  }
}
