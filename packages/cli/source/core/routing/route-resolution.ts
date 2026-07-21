import { applyConfiguredPageRoutePaths, buildLocalizedNavigationFromTabsConfig, buildNavigation, buildNavigationFromTabsConfig } from '../../parsers/routes/routes.js'
import type { ClarifyHookContext, ClarifyPage, ClarifyPlugin, ContentDiagnostic, ContentRoute, NavigationTree } from '../../types.js'
import { runHooks } from '../plugin/hooks.js'

import { describeRouteConflict, findRouteConflicts, formatRouteConflicts, type RouteConflict } from './route-analysis.js'

export async function resolveRoutePages(routes: ContentRoute[], plugins: ClarifyPlugin[], ctx: ClarifyHookContext): Promise<ContentRoute[]> {
  const routeToken = Symbol('clarifyRouteToken')
  type RoutedPage = ClarifyPage & { [routeToken]: number }

  const pages = routes.map<RoutedPage>((route, routeIndex) => ({
    path: route.path,
    filePath: route.source.filePath,
    frontmatter: route.source.frontmatter ?? {},
    content: route.source.content ?? '',
    [routeToken]: routeIndex,
  }))
  const resolvedPages = await runHooks(plugins, 'pages:resolved', pages, ctx)
  const pageByRouteIndex = new Map<number, ClarifyPage>()

  for (const page of resolvedPages) {
    const routeIndex = (page as RoutedPage)[routeToken]
    if (!Number.isInteger(routeIndex) || routeIndex < 0 || routeIndex >= routes.length) {
      throw new Error('[clarify] pages:resolved hooks must preserve each page route identity')
    }
    if (pageByRouteIndex.has(routeIndex)) {
      throw new Error('[clarify] pages:resolved hooks returned the same page route identity more than once')
    }
    pageByRouteIndex.set(routeIndex, page)
  }

  if (pageByRouteIndex.size !== routes.length) {
    throw new Error('[clarify] pages:resolved hooks must return exactly one page for each route')
  }

  return routes.map((route, routeIndex) => {
    const page = pageByRouteIndex.get(routeIndex)!
    return {
      ...route,
      source: {
        ...route.source,
        frontmatter: page.frontmatter,
        content: page.content,
      },
    }
  })
}

function buildNavigationTree(routes: ContentRoute[], ctx: ClarifyHookContext): NavigationTree {
  const tabs = ctx.projectConfig.navigation?.tabs
  if (!tabs) return { kind: 'flat', nodes: buildNavigation(routes) }
  if (!ctx.projectConfig.locales) return buildNavigationFromTabsConfig(routes, tabs)
  return buildLocalizedNavigationFromTabsConfig(routes, tabs, ctx.projectConfig.locales)
    ?? { kind: 'localized-tabbed', locales: {} }
}

export function assertNoRouteConflicts(routes: ContentRoute[]): void {
  const conflicts = findRouteConflicts(routes)
  if (conflicts.length > 0) {
    throw new Error(`[clarify] Route conflicts prevent the site from being built:\n${formatRouteConflicts(conflicts)}`)
  }
}

function createRouteConflictDiagnostic(label: string, routes: ContentRoute[]): ContentDiagnostic {
  return {
    kind: 'route-load',
    title: 'Route conflict',
    message: `This page cannot be rendered because ${label} is used by multiple routes.`,
    details: routes.map(describeRouteConflict).join('\n'),
  }
}

export function createDevRouteConflictRoutes(routes: ContentRoute[]): ContentRoute[] {
  const conflicts = findRouteConflicts(routes)
  if (conflicts.length === 0) return routes

  const conflictedRoutes = new Map<ContentRoute, RouteConflict>()
  for (const conflict of conflicts) {
    for (const route of conflict.routes) conflictedRoutes.set(route, conflict)
  }

  function createConflictRoute<T extends ContentRoute>(route: T, conflict: RouteConflict): T {
    return {
      ...route,
      module: { ...route.module, pageVirtualModuleId: `${route.module.pageVirtualModuleId}__conflict` },
      diagnostic: createRouteConflictDiagnostic(conflict.label, conflict.routes),
    }
  }

  const usedPaths = new Set<string>()
  return routes.flatMap(route => {
    const conflict = conflictedRoutes.get(route)
    if (!conflict) return [route]
    if (usedPaths.has(route.path)) return []
    usedPaths.add(route.path)
    return [createConflictRoute(route, conflict)]
  })
}

function handleRouteConflicts(routes: ContentRoute[], development: boolean): ContentRoute[] {
  if (development) return createDevRouteConflictRoutes(routes)
  assertNoRouteConflicts(routes)
  return routes
}

export async function resolveRouteState(routes: ContentRoute[], plugins: ClarifyPlugin[], ctx: ClarifyHookContext, development: boolean): Promise<{ routes: ContentRoute[], navigation: NavigationTree }> {
  const tabs = ctx.projectConfig.navigation?.tabs
  const configuredRoutes = applyConfiguredPageRoutePaths(routes, tabs, ctx.projectConfig.locales)
  const navigation = buildNavigationTree(configuredRoutes, ctx)
  const resolved = await runHooks(plugins, 'routes:resolved', { routes: configuredRoutes, navigation }, ctx)
  const finalRoutes = handleRouteConflicts(resolved.routes, development)

  return {
    routes: finalRoutes,
    navigation: finalRoutes === resolved.routes ? resolved.navigation : buildNavigationTree(finalRoutes, ctx),
  }
}
