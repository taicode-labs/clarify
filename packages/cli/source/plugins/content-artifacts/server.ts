import type { IncomingMessage, ServerResponse } from 'node:http'

import { stringify as yamlStringify } from 'yaml'

import type { ContentRoute, ResolvedProjectConfig } from '../../types.js'

import { createLlmsTxtArtifact, readRouteArtifactContent } from './artifacts.js'

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

export function resolveContentArtifactType(route: ContentRoute): string {
  return route.kind === 'openapi'
    ? 'application/json; charset=utf-8'
    : 'text/markdown; charset=utf-8'
}

export function serveContentArtifacts(req: IncomingMessage, res: ServerResponse, projectConfig: ResolvedProjectConfig, routes: ContentRoute[]): boolean {
  const contentPath = resolveContentArtifactPath(req.url, projectConfig)

  if (contentPath === '/llms.txt') {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end(createLlmsTxtArtifact(routes, projectConfig), 'utf8')
    return true
  }

  // Handle YAML variant for OpenAPI routes: /api.openapi.yaml → serve YAML
  if (contentPath.endsWith('.openapi.yaml')) {
    const jsonPath = contentPath.replace(/\.yaml$/, '.json')
    const route = routes.find(route => route.artifacts?.contentArtifactUrl === jsonPath)
    if (route?.kind === 'openapi' && route.source.content) {
      const spec = JSON.parse(route.source.content)
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/yaml; charset=utf-8')
      res.end(yamlStringify(spec, { lineWidth: 0 }), 'utf8')
      return true
    }
    return false
  }

  const route = routes.find(route => route.artifacts?.contentArtifactUrl === contentPath)
  if (!route) return false

  res.statusCode = 200
  res.setHeader('Content-Type', resolveContentArtifactType(route))
  res.end(readRouteArtifactContent(route), 'utf8')
  return true
}
