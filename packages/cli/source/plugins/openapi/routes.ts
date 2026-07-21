import { join } from 'node:path'

import { pageVirtualModuleId } from '../../core/runtime/module-ids.js'
import { localizedRoutePath, openAPIPagePathFromRef, routeIntentFromPagesItem, withAlternates } from '../../parsers/routes/routes.js'
import type { ClarifyOpenAPIRouteIntent, ClarifyPagesConfig, ClarifyPagesItem, ContentRoute, OpenAPIContentRoute, ResolvedClarifyLocalesConfig, ResolvedProjectConfig } from '../../types.js'

import { findOpenAPIRoutes } from './parser.js'

function collectOpenAPIPageIntents(config: ResolvedProjectConfig): ClarifyOpenAPIRouteIntent[] {
  const intents: ClarifyOpenAPIRouteIntent[] = []

  function visitItems(items: ClarifyPagesItem[]) {
    for (const item of items) {
      if (typeof item !== 'string' && 'group' in item) {
        visitItems(item.pages)
        continue
      }
      const intent = routeIntentFromPagesItem(item)
      if (intent.kind === 'openapi' && (intent.path || intent.tagFilter?.length)) intents.push(intent)
    }
  }

  function visitPages(pages?: ClarifyPagesConfig) {
    if (!pages || pages === 'FileTree') return
    for (const group of pages) visitItems(group.pages)
  }

  for (const tab of config.navigation?.tabs ?? []) visitPages(tab.pages)
  return intents
}

function cloneOpenAPIRoute(route: OpenAPIContentRoute, overrides: Partial<OpenAPIContentRoute> = {}): OpenAPIContentRoute {
  return {
    ...route,
    meta: { ...route.meta, sections: route.meta.sections ? [...route.meta.sections] : undefined },
    module: { ...route.module },
    source: { ...route.source },
    openapi: route.openapi ? { ...route.openapi, tagFilter: route.openapi.tagFilter ? [...route.openapi.tagFilter] : undefined } : undefined,
    alternates: route.alternates ? { ...route.alternates } : undefined,
    ...overrides,
  }
}

export function discoverOpenAPIRoutes(contentRoot: string, locales?: ResolvedClarifyLocalesConfig): OpenAPIContentRoute[] {
  if (!locales) return findOpenAPIRoutes(contentRoot)

  const localizedRoutes: OpenAPIContentRoute[] = []
  for (const locale of locales.locales) {
    const localeRoot = join(contentRoot, locale.code)
    for (const route of findOpenAPIRoutes(localeRoot, localeRoot)) {
      const basePath = route.basePath ?? route.path
      const path = localizedRoutePath(basePath, locale.code, locales)
      localizedRoutes.push({
        ...route,
        path,
        basePath,
        locale: locale.code,
        module: { pageVirtualModuleId: pageVirtualModuleId(path) },
      })
    }
  }

  if (locales.missing !== 'fallback') return localizedRoutes

  const routeByLocaleAndBase = new Map(localizedRoutes.map(route => [`${route.locale ?? ''}:${route.basePath ?? route.path}`, route]))
  const defaultRoutes = localizedRoutes.filter(route => route.locale === locales.default)
  for (const sourceRoute of defaultRoutes) {
    const basePath = sourceRoute.basePath ?? sourceRoute.path
    for (const locale of locales.locales) {
      const key = `${locale.code}:${basePath}`
      if (routeByLocaleAndBase.has(key)) continue
      const path = localizedRoutePath(basePath, locale.code, locales)
      localizedRoutes.push(cloneOpenAPIRoute(sourceRoute, {
        path,
        locale: locale.code,
        module: { pageVirtualModuleId: pageVirtualModuleId(path) },
        isFallback: true,
      }))
    }
  }

  return localizedRoutes
}

export function expandConfiguredOpenAPIRoutes(routes: ContentRoute[], config: ResolvedProjectConfig): ContentRoute[] {
  const openAPIIntents = collectOpenAPIPageIntents(config)
  if (!openAPIIntents.length) return routes

  const additions: OpenAPIContentRoute[] = []
  const existingKeys = new Set(routes.map(route => `${route.locale ?? ''}:${route.basePath ?? route.path}`))

  for (const intent of openAPIIntents) {
    const tagFilter = intent.tagFilter?.filter(Boolean)
    const sourceBasePath = openAPIPagePathFromRef(intent.ref)
    const targetBasePath = openAPIPagePathFromRef(intent.ref, tagFilter, intent.path)
    if (sourceBasePath === targetBasePath && !tagFilter?.length) continue

    for (const route of routes) {
      if (route.kind !== 'openapi' || (route.basePath ?? route.path) !== sourceBasePath) continue
      const key = `${route.locale ?? ''}:${targetBasePath}`
      if (existingKeys.has(key)) continue
      existingKeys.add(key)

      const path = route.locale && config.locales ? localizedRoutePath(targetBasePath, route.locale, config.locales) : targetBasePath
      additions.push(cloneOpenAPIRoute(route, {
        path,
        basePath: targetBasePath,
        module: { pageVirtualModuleId: pageVirtualModuleId(path) },
        openapi: { ...route.openapi, tagFilter: tagFilter?.length ? tagFilter : undefined },
      }))
    }
  }

  const nextRoutes = [...routes, ...additions]
  if (!config.locales) return nextRoutes

  const routesWithAlternates = nextRoutes.map(route => withAlternates(route, nextRoutes, config.locales!))
  const bareAliases: OpenAPIContentRoute[] = []
  const seenBare = new Set(routesWithAlternates.map(route => route.path))

  for (const route of routesWithAlternates) {
    if (route.kind !== 'openapi' || route.locale !== config.locales.default) continue
    const basePath = route.basePath ?? route.path
    if (basePath === route.path || seenBare.has(basePath)) continue
    seenBare.add(basePath)
    bareAliases.push(cloneOpenAPIRoute(route, {
      path: basePath,
      module: { pageVirtualModuleId: pageVirtualModuleId(basePath) },
      isBareAlias: true,
    }))
  }

  return [...routesWithAlternates, ...bareAliases]
}
