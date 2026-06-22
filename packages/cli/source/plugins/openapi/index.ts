import { localizedRoutePath, openAPIPagePathFromRef, openAPITagsPathSegment } from '../../parsers/routes.js'
import type { ClarifyPagesConfig, ClarifyPagesItem, ClarifyPlugin, ContentRoute, OpenAPISpec, ResolvedClarifyI18nConfig, ResolvedProjectConfig } from '../../types.js'

import { extractOpenAPISections, findOpenAPIRoutes, readOpenAPISpec } from './parser.js'
import { generateOpenAPIErrorModule, generateOpenAPIModule, generateOpenAPIRegistryModule, openApiRegistryModuleId } from './virtual-modules.js'

type OpenAPISpecEntry = {
  spec: OpenAPISpec
  tagFilter?: string[]
}

function collectOpenAPIPageItems(config: ResolvedProjectConfig): Array<Extract<ClarifyPagesItem, { openapi: string }>> {
  const items: Array<Extract<ClarifyPagesItem, { openapi: string }>> = []

  function visitPages(pages?: ClarifyPagesConfig) {
    if (!pages || pages === 'FileTree') return
    for (const group of pages) {
      for (const item of group.pages) {
        if (typeof item !== 'string' && 'openapi' in item && item.filter?.tags?.length) items.push(item)
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

function createTaggedOpenAPIRoutes(routes: ContentRoute[], config: ResolvedProjectConfig): ContentRoute[] {
  const pageItems = collectOpenAPIPageItems(config)
  if (!pageItems.length) return routes

  const additions: ContentRoute[] = []
  const existingKeys = new Set(routes.map(route => `${route.locale ?? ''}:${route.basePath ?? route.path}`))

  for (const item of pageItems) {
    const tagFilter = item.filter?.tags?.filter(Boolean)
    if (!tagFilter?.length) continue

    const sourceBasePath = openAPIPagePathFromRef(item.openapi)
    const filteredBasePath = openAPIPagePathFromRef(item.openapi, tagFilter)
    for (const route of routes) {
      if (route.kind !== 'openapi' || (route.basePath ?? route.path) !== sourceBasePath) continue

      const key = `${route.locale ?? ''}:${filteredBasePath}`
      if (existingKeys.has(key)) continue
      existingKeys.add(key)

      additions.push({
        ...route,
        path: route.locale && config.i18n ? localizedRoutePath(filteredBasePath, route.locale, config.i18n) : filteredBasePath,
        basePath: filteredBasePath,
        title: route.title,
        virtualModuleId: `${route.virtualModuleId}/${openAPITagsPathSegment(tagFilter)}`,
        openapiTagFilter: tagFilter,
      })
    }
  }

  const nextRoutes = [...routes, ...additions]
  return config.i18n ? nextRoutes.map(route => withAlternates(route, nextRoutes, config.i18n!)) : nextRoutes
}

export function createOpenAPIPlugin(): ClarifyPlugin {
  const specs: Record<string, OpenAPISpecEntry> = {}

  return {
    name: 'clarify:openapi',
    hooks: {
      'routes:discover': (input) => ({
        ...input,
        routes: [...input.routes, ...findOpenAPIRoutes(input.contentRoot)],
      }),
      'routes:discovered': async (routes, ctx) => {
        for (const key of Object.keys(specs)) delete specs[key]

        const nextRoutes = createTaggedOpenAPIRoutes(routes, ctx.projectConfig)
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
          specs[route.virtualModuleId] = { spec, tagFilter: route.openapiTagFilter }
          specs[`virtual:clarify-page/${route.path.replace(/^\//, '')}`] = { spec, tagFilter: route.openapiTagFilter }
          route.title = spec.info?.title ?? route.title
          route.description = spec.info?.description ?? route.description
          route.sections = extractOpenAPISections(spec, route.openapiTagFilter)
        }

        return nextRoutes
      },
      'modules:before': (modules, ctx) => {
        modules.set(openApiRegistryModuleId, generateOpenAPIRegistryModule(Object.fromEntries(Object.entries(specs).map(([moduleId, entry]) => [moduleId, entry.spec]))))

        for (const [moduleId, entry] of Object.entries(specs)) {
          modules.set(moduleId, generateOpenAPIModule(entry.spec, entry.tagFilter))
        }

        for (const route of ctx.routes.filter(route => route.kind === 'openapi' && route.diagnostic)) {
          if (route.diagnostic) modules.set(route.virtualModuleId, generateOpenAPIErrorModule(route.diagnostic))
        }

        return modules
      },
    },
  }
}
