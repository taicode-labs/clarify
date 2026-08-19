import type { ClarifyArtifact, ContentRoute, ResolvedProjectConfig } from '../../types.js'
import { createOpenAPIRouteArtifacts, createRootOpenAPIArtifact } from '../openapi/artifacts.js'

import { createLlmsTxtArtifact, readRouteArtifactContent } from './artifacts.js'

export function createContentArtifacts(routes: ContentRoute[], projectConfig: ResolvedProjectConfig): ClarifyArtifact[] {
  const artifacts: ClarifyArtifact[] = []

  for (const route of routes) {
    if (route.kind === 'openapi') {
      artifacts.push(...createOpenAPIRouteArtifacts(route))
      continue
    }

    const contentArtifactUrl = route.artifacts?.contentArtifactUrl
    if (!contentArtifactUrl) continue
    artifacts.push({
      fileName: contentArtifactUrl.replace(/^\//, ''),
      contentType: 'text/markdown; charset=utf-8',
      source: readRouteArtifactContent(route),
    })
  }

  artifacts.push({
    fileName: 'llms.txt',
    contentType: 'text/plain; charset=utf-8',
    source: createLlmsTxtArtifact(routes, projectConfig),
  })
  artifacts.push(createRootOpenAPIArtifact(routes, projectConfig))

  return artifacts
}

export function findContentArtifact(path: string, routes: ContentRoute[], projectConfig: ResolvedProjectConfig): ClarifyArtifact | undefined {
  const fileName = path.replace(/^\/+/, '')
  return createContentArtifacts(routes, projectConfig).find(artifact => artifact.fileName === fileName)
}
