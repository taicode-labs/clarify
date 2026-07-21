import type { ContentRoute } from '../../types.js'

export type RouteConflictKind = 'path' | 'page-module'

export type RouteConflict = {
  kind: RouteConflictKind
  key: string
  label: string
  routes: ContentRoute[]
}

function routeDescription(route: ContentRoute): string {
  return `${route.kind} ${route.source.filePath}`
}

function collectConflicts(routes: ContentRoute[], keyOf: (route: ContentRoute) => string): Map<string, ContentRoute[]> {
  const grouped = new Map<string, ContentRoute[]>()
  for (const route of routes) {
    const key = keyOf(route)
    grouped.set(key, [...(grouped.get(key) ?? []), route])
  }
  return grouped
}

export function describeRouteConflict(route: ContentRoute): string {
  return routeDescription(route)
}

export function findRouteConflicts(routes: ContentRoute[]): RouteConflict[] {
  const conflicts: RouteConflict[] = []

  for (const [path, pathRoutes] of collectConflicts(routes, route => route.path)) {
    if (pathRoutes.length < 2) continue
    conflicts.push({ kind: 'path', key: path, label: `path ${path}`, routes: pathRoutes })
  }

  for (const [pageModuleId, moduleRoutes] of collectConflicts(routes, route => route.module.pageVirtualModuleId)) {
    if (moduleRoutes.length < 2) continue
    if (moduleRoutes.every(route => route.path === moduleRoutes[0]!.path)) continue
    conflicts.push({ kind: 'page-module', key: pageModuleId, label: `page module ${pageModuleId}`, routes: moduleRoutes })
  }

  return conflicts
}

export function formatRouteConflicts(conflicts: RouteConflict[]): string {
  return conflicts
    .map(conflict => `- ${conflict.label}: ${conflict.routes.map(describeRouteConflict).join(', ')}`)
    .join('\n')
}
