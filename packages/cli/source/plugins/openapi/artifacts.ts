import { stringify as yamlStringify } from 'yaml'

import type { ClarifyArtifact, ContentRoute, OpenAPISpec, ResolvedProjectConfig } from '../../types.js'

import { aggregateOpenAPISources, type OpenAPISourceDocument } from './aggregation.js'

export function selectRootOpenAPISources(routes: ContentRoute[], projectConfig: ResolvedProjectConfig): OpenAPISourceDocument[] {
  const defaultLocale = projectConfig.locales?.default
  const sourcesByFilePath = new Map<string, OpenAPISourceDocument>()

  for (const route of routes) {
    if (
      route.kind !== 'openapi' ||
      route.diagnostic ||
      !route.source.content ||
      route.openapi?.tagFilter?.length ||
      route.isBareAlias ||
      (defaultLocale && route.locale && route.locale !== defaultLocale)
    ) continue

    sourcesByFilePath.set(route.source.filePath, {
      id: route.openapi?.sourceSpecId ?? route.source.filePath.split(/[\\/]/).pop()?.replace(/\.openapi\.(?:json|ya?ml)$/i, '') ?? 'service',
      filePath: route.source.filePath,
      document: JSON.parse(route.source.content) as OpenAPISpec,
    })
  }

  return [...sourcesByFilePath.values()]
}

export function createRootOpenAPISpec(routes: ContentRoute[], projectConfig: ResolvedProjectConfig): OpenAPISpec {
  return aggregateOpenAPISources(selectRootOpenAPISources(routes, projectConfig), {
    title: projectConfig.title,
    description: projectConfig.description,
  })
}

export function createOpenAPIRouteArtifacts(route: ContentRoute): ClarifyArtifact[] {
  if (route.kind !== 'openapi' || !route.source.content) return []
  const contentArtifactUrl = route.artifacts?.contentArtifactUrl
  if (!contentArtifactUrl) return []

  return [
    {
      fileName: contentArtifactUrl.replace(/^\//, ''),
      contentType: 'application/json; charset=utf-8',
      source: route.source.content,
    },
    {
      fileName: contentArtifactUrl.replace(/\.json$/, '.yaml').replace(/^\//, ''),
      contentType: 'text/yaml; charset=utf-8',
      source: yamlStringify(JSON.parse(route.source.content), { lineWidth: 0 }),
    },
  ]
}

export function createRootOpenAPIArtifact(routes: ContentRoute[], projectConfig: ResolvedProjectConfig): ClarifyArtifact {
  return {
    fileName: 'openapi.json',
    contentType: 'application/json; charset=utf-8',
    source: JSON.stringify(createRootOpenAPISpec(routes, projectConfig), null, 2),
  }
}
