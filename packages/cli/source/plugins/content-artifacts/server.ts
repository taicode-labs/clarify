import type { IncomingMessage, ServerResponse } from 'node:http'

import { createLlmsTxt, readRawContent } from '../../parsers/raw-content.js'
import type { ContentRoute, ResolvedProjectConfig } from '../../types.js'

function normalizeRoutePrefix(routePrefix: string): string {
  if (!routePrefix || routePrefix === '/') return ''
  return `/${routePrefix.replace(/^\/+|\/+$/g, '')}`
}

export function resolveContentArtifactPath(url: string | undefined, projectConfig: ResolvedProjectConfig): string {
  const requestPath = url?.split('?')[0] ?? ''
  const basePath = normalizeRoutePrefix(projectConfig.routePrefix)
  return basePath && requestPath.startsWith(basePath)
    ? requestPath.slice(basePath.length) || '/'
    : requestPath
}

export function resolveRawContentType(route: ContentRoute): string {
  if (route.kind === 'openapi' && /\.ya?ml$/i.test(route.rawContentUrl ?? '')) {
    return 'text/yaml; charset=utf-8'
  }

  return route.kind === 'openapi'
    ? 'application/json; charset=utf-8'
    : 'text/markdown; charset=utf-8'
}

export function serveContentArtifacts(req: IncomingMessage, res: ServerResponse, projectConfig: ResolvedProjectConfig, routes: ContentRoute[]): boolean {
  const contentPath = resolveContentArtifactPath(req.url, projectConfig)

  if (contentPath === '/llms.txt') {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end(createLlmsTxt(routes, projectConfig))
    return true
  }

  const route = routes.find(route => route.rawContentUrl === contentPath)
  if (!route) return false

  res.statusCode = 200
  res.setHeader('Content-Type', resolveRawContentType(route))
  res.end(readRawContent(route))
  return true
}
