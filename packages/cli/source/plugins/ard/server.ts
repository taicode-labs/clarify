import type { IncomingMessage, ServerResponse } from 'node:http'

import type { ContentRoute, ResolvedProjectConfig } from '../../types.js'

import { ARD_MANIFEST_FILE_NAME, createArdManifest } from './manifest.js'

function normalizeRoutePrefix(routePrefix: string): string {
  if (!routePrefix || routePrefix === '/') return ''
  return `/${routePrefix.replace(/^\/+|\/+$/g, '')}`
}

function isManifestRequestPath(requestPath: string, routePrefix: string): boolean {
  const manifestPath = `/${ARD_MANIFEST_FILE_NAME}`
  return requestPath === manifestPath || requestPath === `${normalizeRoutePrefix(routePrefix)}${manifestPath}`
}

export function serveArdManifest(req: IncomingMessage, res: ServerResponse, config: ResolvedProjectConfig, routes: ContentRoute[]): boolean {
  const requestPath = req.url?.split('?')[0] ?? ''
  if (!isManifestRequestPath(requestPath, config.routePrefix)) return false

  const manifest = createArdManifest(routes, config)
  if (!manifest) return false

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(manifest, null, 2))
  return true
}
