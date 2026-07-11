import { join, relative } from 'node:path'

import { createProjectContentProcessor } from '../../parsers/content/content.js'
import { localizedRoutePath, openAPIPagePathFromRef, routeIntentFromPagesItem, withAlternates } from '../../parsers/routes/routes.js'
import type { ClarifyOpenAPIRouteIntent, ClarifyPagesConfig, ClarifyPlugin, ContentRoute, OpenAPISpec, ResolvedClarifyI18nConfig, ResolvedProjectConfig } from '../../types.js'

import { extractOpenAPISections, filterSpecByTags, findOpenAPIRoutes, readOpenAPISpec } from './parser.js'
import { generateOpenAPIErrorModule, generateOpenAPIPageModule, generateOpenAPIRegistryModule, generateOpenAPIServerRegistryModule, generateOpenAPISpecModule, openApiRegistryModuleId, openApiServerRegistryModuleId, specVirtualModuleId } from './virtual-modules.js'

type OpenAPISpecEntry = {
  spec: OpenAPISpec
  /** Source spec file path – used as deduplication key across routes. */
  filePath: string
}

function collectOpenAPIPageIntents(config: ResolvedProjectConfig): ClarifyOpenAPIRouteIntent[] {
  const intents: ClarifyOpenAPIRouteIntent[] = []

  function visitPages(pages?: ClarifyPagesConfig) {
    if (!pages || pages === 'FileTree') return
    for (const group of pages) {
      for (const item of group.pages) {
        const intent = routeIntentFromPagesItem(item)
        if (intent.kind === 'openapi' && (intent.path || intent.tagFilter?.length)) intents.push(intent)
      }
    }
  }

  for (const tab of config.tabs ?? []) visitPages(tab.pages)

  return intents
}

function virtualModuleIdFromPath(path: string): string {
  return `virtual:clarify-page/${path.replace(/^\/+/, '') || 'index'}`
}

function findOpenAPIRoutesForContentRoot(contentRoot: string, i18n?: ResolvedClarifyI18nConfig): ContentRoute[] {
  if (!i18n) return findOpenAPIRoutes(contentRoot)

  const localizedRoutes: ContentRoute[] = []
  for (const locale of i18n.locales) {
    const localeRoot = join(contentRoot, locale.code)
    for (const route of findOpenAPIRoutes(localeRoot, localeRoot)) {
      const basePath = route.basePath ?? route.path
      const path = localizedRoutePath(basePath, locale.code, i18n)
      localizedRoutes.push({
        ...route,
        path,
        basePath,
        locale: locale.code,
        module: { virtualModuleId: virtualModuleIdFromPath(path) },
      })
    }
  }

  if (i18n.missing === 'fallback') {
    const routeByLocaleAndBase = new Map(localizedRoutes.map(route => [`${route.locale ?? ''}:${route.basePath ?? route.path}`, route]))
    const defaultRoutes = localizedRoutes.filter(route => route.locale === i18n.defaultLocale)
    for (const sourceRoute of defaultRoutes) {
      const basePath = sourceRoute.basePath ?? sourceRoute.path
      for (const locale of i18n.locales) {
        const key = `${locale.code}:${basePath}`
        if (routeByLocaleAndBase.has(key)) continue
        const path = localizedRoutePath(basePath, locale.code, i18n)
        localizedRoutes.push({
          ...sourceRoute,
          path,
          locale: locale.code,
          module: { virtualModuleId: virtualModuleIdFromPath(path) },
          isFallback: true,
        })
      }
    }
  }

  return localizedRoutes
}

function createConfiguredOpenAPIRoutes(routes: ContentRoute[], config: ResolvedProjectConfig): ContentRoute[] {
  const openAPIIntents = collectOpenAPIPageIntents(config)
  if (!openAPIIntents.length) return routes

  const additions: ContentRoute[] = []
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

      const path = route.locale && config.i18n ? localizedRoutePath(targetBasePath, route.locale, config.i18n) : targetBasePath

      additions.push({
        ...route,
        path,
        basePath: targetBasePath,
        module: { virtualModuleId: virtualModuleIdFromPath(path) },
        openapi: {
          ...route.openapi,
          tagFilter: tagFilter?.length ? tagFilter : undefined,
        },
      })
    }
  }

  const nextRoutes = [...routes, ...additions]
  if (!config.i18n) return nextRoutes

  const routesWithAlternates = nextRoutes.map(route => withAlternates(route, nextRoutes, config.i18n!))
  const bareAliases: ContentRoute[] = []
  const seenBare = new Set(routesWithAlternates.map(route => route.path))

  for (const route of routesWithAlternates) {
    if (route.locale !== config.i18n.defaultLocale) continue
    const basePath = route.basePath ?? route.path
    if (basePath === route.path || seenBare.has(basePath)) continue
    seenBare.add(basePath)
    bareAliases.push({
      ...route,
      path: basePath,
      module: { virtualModuleId: virtualModuleIdFromPath(basePath) },
      isBareAlias: true,
    })
  }

  return [...routesWithAlternates, ...bareAliases]
}

/** Derive a stable, deduplicated key from an absolute spec file path. */
function specFileKeyFromPath(filePath: string, projectRoot: string): string {
  return relative(projectRoot, filePath).replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
}

function specModuleKeyForRoute(specFileKey: string, tagFilter?: string[]): string {
  if (!tagFilter?.length) return specFileKey
  const suffix = tagFilter.map(tag => tag.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'tag').join('_')
  return `${specFileKey}_tags_${suffix}`
}

function openAPIRegistryKeys(route: ContentRoute): string[] {
  const keys = new Set<string>()
  const path = (route.path || '/').replace(/^\//, '')
  const base = (route.basePath ?? route.path).replace(/^\//, '')

  if (route.locale) keys.add(`virtual:clarify-page/${route.locale}/${base}`)
  if (path) keys.add(`virtual:clarify-page/${path}`)
  else keys.add('virtual:clarify-page/index')
  if (!route.locale && base) keys.add(`virtual:clarify-page/${base}`)

  return [...keys]
}

export function createOpenAPIPlugin(): ClarifyPlugin {
  /** specs keyed by specFileKey (deduplicated per source file). */
  const specs = new Map<string, OpenAPISpecEntry>()
  const specModules = new Map<string, OpenAPISpec>()

  return {
    name: 'clarify:openapi',
    hooks: {
      'routes:discover': (input, ctx) => ({
        ...input,
        routes: [...input.routes, ...findOpenAPIRoutesForContentRoot(input.contentRoot, ctx.projectConfig.i18n)],
      }),
      'routes:discovered': async (routes, ctx) => {
        specs.clear()
        specModules.clear()

        const nextRoutes = createConfiguredOpenAPIRoutes(routes, ctx.projectConfig)
        const specByFilePath = new Map<string, OpenAPISpec>()

        for (const route of nextRoutes.filter(route => route.kind === 'openapi')) {
          const specFromCache = specByFilePath.get(route.source.filePath)
          const processor = createProjectContentProcessor(ctx.plugins, ctx)
          const result = specFromCache ? { ok: true as const, spec: specFromCache } : await readOpenAPISpec(route.source.filePath, processor)
          if (!result.ok) {
            route.diagnostic = result.diagnostic
            route.meta.title = route.meta.title || 'OpenAPI parse error'
            route.meta.sections = []
            continue
          }

          const spec = result.spec
          specByFilePath.set(route.source.filePath, spec)

          // Derive a stable dedup key from the spec file path
          const specKey = specFileKeyFromPath(route.source.filePath, ctx.generateOptions.projectRoot)
          route.openapi = {
            ...route.openapi,
            sourceSpecKey: specKey,
          }

          specs.set(specKey, { spec, filePath: route.source.filePath })
          route.meta.title = spec.info?.title ?? route.meta.title
          route.meta.description = spec.info?.description ?? route.meta.description
          route.meta.sections = extractOpenAPISections(spec, route.openapi?.tagFilter)

          // Set source.content to filtered or full JSON for the content-artifacts plugin
          const pageSpec = route.openapi?.tagFilter?.length
            ? filterSpecByTags(spec, route.openapi.tagFilter)
            : spec
          const specModuleKey = specModuleKeyForRoute(specKey, route.openapi?.tagFilter)
          route.openapi.routeSpecKey = specModuleKey
          specModules.set(specModuleKey, pageSpec)
          route.source.content = JSON.stringify(pageSpec)
        }

        return nextRoutes
      },
      'modules:before': (modules, ctx) => {
        // ── Registry modules ──
        // Route page modules static-import their spec modules. The client
        // registry remains for MDX-embedded OpenAPI components that resolve a
        // specPath at runtime; the server registry keeps SSR context hydrated.
        const registryEntries: Record<string, string> = {}
        const serverRegistryEntries: Record<string, OpenAPISpec> = {}

        for (const route of ctx.routes) {
          if (route.kind !== 'openapi' || !route.openapi?.sourceSpecKey) continue
          const specModuleKey = route.openapi.routeSpecKey ?? route.openapi.sourceSpecKey
          const spec = specModules.get(specModuleKey) ?? specs.get(route.openapi.sourceSpecKey)?.spec
          if (!spec) continue

          for (const registryKey of openAPIRegistryKeys(route)) {
            registryEntries[registryKey] = specVirtualModuleId(specModuleKey)
            serverRegistryEntries[registryKey] = spec
          }
        }

        modules.set(openApiRegistryModuleId, generateOpenAPIRegistryModule(registryEntries))
        modules.set(openApiServerRegistryModuleId, generateOpenAPIServerRegistryModule(serverRegistryEntries))

        // ── Per-spec virtual modules ──
        for (const [specKey, spec] of specModules) {
          modules.set(specVirtualModuleId(specKey), generateOpenAPISpecModule(spec))
        }

        // ── Per-route page modules ──
        for (const route of ctx.routes) {
          if (route.kind !== 'openapi') continue
          if (route.diagnostic) {
            modules.set(route.module.virtualModuleId, generateOpenAPIErrorModule(route.diagnostic))
          } else if (route.openapi?.sourceSpecKey) {
            const specModuleKey = route.openapi.routeSpecKey ?? route.openapi.sourceSpecKey
            if (!specModules.has(specModuleKey)) continue
            modules.set(route.module.virtualModuleId, generateOpenAPIPageModule({
              specModuleId: specVirtualModuleId(specModuleKey),
            }))
          }
        }

        return modules
      },
    },
  }
}
