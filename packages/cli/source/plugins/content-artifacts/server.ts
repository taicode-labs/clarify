import type { IncomingMessage, ServerResponse } from 'node:http'

import type { ContentRoute, ResolvedProjectConfig } from '../../types.js'

import { findContentArtifact } from './provider.js'

function normalizeRoutePrefix(routePrefix: string): string {
  if (!routePrefix || routePrefix === '/') return ''
  return `/${routePrefix.replace(/^\/+|\/+$/g, '')}`
}

export function resolveContentArtifactPath(url: string | undefined, projectConfig: ResolvedProjectConfig): string {
  const requestPath = url?.split('?')[0] ?? ''
  const basePath = normalizeRoutePrefix(projectConfig.routePrefix)
  const hasBasePath = requestPath === basePath || requestPath.startsWith(`${basePath}/`)
  return basePath && hasBasePath
    ? requestPath.slice(basePath.length) || '/'
    : requestPath
}

export function resolveContentArtifactType(route: ContentRoute): string {
  return route.kind === 'openapi'
    ? 'application/json; charset=utf-8'
    : 'text/markdown; charset=utf-8'
}

export function serveContentArtifacts(req: IncomingMessage, res: ServerResponse, projectConfig: ResolvedProjectConfig, routes: ContentRoute[]): boolean {
  const contentPath = resolveContentArtifactPath(req.url, projectConfig)
  const artifact = findContentArtifact(contentPath, routes, projectConfig)
  if (!artifact) return false

  res.statusCode = 200
  res.setHeader('Content-Type', artifact.contentType)
  res.end(artifact.source)
  return true
}
