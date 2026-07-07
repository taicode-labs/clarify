import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { ContentDocument } from '@clarify-labs/renderer'
import SwaggerParser from '@apidevtools/swagger-parser'
import GithubSlugger from 'github-slugger'

import type { ContentProcessor } from '../content/index.js'
import { kebabToTitle, routePathFromFilePath, virtualModuleIdFromFilePath } from '../router/index.js'
import type { ContentDiagnostic, ContentRoute, ContentSection, OpenAPISpec } from '../../types.js'

import { createContentDocument, syncContentDocumentRoute } from '../content/content-document.js'
import { createOpenAPIContentDocument } from './content-document.js'

const OPENAPI_HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const

type ResolverFileInfo = { url: string }

export type OpenAPIParseResult =
  | { ok: true; spec: OpenAPISpec }
  | { ok: false; diagnostic: ContentDiagnostic }

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isSameOpenAPIFile(url: string, filePath: string): boolean {
  try {
    return resolve(fileURLToPath(url)) === resolve(filePath)
  } catch {
    return resolve(url) === resolve(filePath)
  }
}

function operationMatchesTags(operationTags: string[] | undefined, filterTags: string[] | undefined): boolean {
  if (!filterTags?.length) return true
  return operationTags?.some(tag => filterTags.includes(tag)) ?? false
}

export function findOpenAPIRoutes(dir: string, base: string = dir): ContentRoute[] {
  const routes: ContentRoute[] = []
  if (!existsSync(dir)) return routes

  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      routes.push(...findOpenAPIRoutes(fullPath, base))
      continue
    }
    if (!entry.isFile() || !/\.openapi\.(json|yaml|yml)$/.test(entry.name)) continue

    const cleanPath = routePathFromFilePath(fullPath, base)
    const title = kebabToTitle(cleanPath.split('/').pop() ?? 'API')
    routes.push({
      path: cleanPath,
      basePath: cleanPath,
      filePath: fullPath,
      virtualModuleId: virtualModuleIdFromFilePath(fullPath, base),
      title,
      kind: 'openapi',
    })
  }

  return routes
}

export function filterSpecByTags(spec: OpenAPISpec, tags: string[]): OpenAPISpec {
  const filteredPaths: Record<string, unknown> = {}
  const paths = (spec.paths ?? {}) as Record<string, unknown>
  for (const path of Object.keys(paths)) {
    const pathItem = paths[path] as Record<string, unknown> | undefined
    if (!pathItem) continue
    const hasMatch = Object.values(pathItem).some(op => op && typeof op === 'object' && operationMatchesTags((op as Record<string, unknown>).tags as string[] | undefined, tags))
    if (hasMatch) filteredPaths[path] = pathItem
  }
  return { ...spec, paths: filteredPaths } as OpenAPISpec
}

export function extractOpenAPISections(spec: OpenAPISpec, filterTags?: string[]): ContentSection[] {
  const sections: ContentSection[] = []
  const paths = spec.paths ?? {}
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue
    for (const method of OPENAPI_HTTP_METHODS) {
      const op = pathItem[method]
      if (!op || !operationMatchesTags(op.tags, filterTags)) continue
      const title = op.summary ?? `${method.toUpperCase()} ${path}`
      sections.push({ id: new GithubSlugger().slug(`${method} ${path}`), title, level: 2, badge: method.toUpperCase(), tags: op.tags })
    }
  }
  return sections
}

function buildOpenAPIContentDocument(route: ContentRoute, spec: OpenAPISpec, specFileKey: string, metadata: ContentDocument['metadata'] = {}) {
  return createOpenAPIContentDocument(route, spec, specFileKey, metadata)
}

export async function readOpenAPISpec(filePath: string, contentProcessor?: ContentProcessor): Promise<OpenAPIParseResult> {
  try {
    if (!contentProcessor) return { ok: true, spec: await SwaggerParser.dereference(filePath) as OpenAPISpec }

    const source = readFileSync(filePath, 'utf-8')
    const transformedSource = await contentProcessor.processText(source, 'openapi', filePath)
    if (transformedSource === source) return { ok: true, spec: await SwaggerParser.dereference(filePath) as OpenAPISpec }

    return {
      ok: true,
      spec: await SwaggerParser.dereference(filePath, {
        resolve: {
          transformedOpenAPISource: {
            order: 1,
            canRead: (file: ResolverFileInfo) => isSameOpenAPIFile(file.url, filePath),
            read: () => transformedSource,
          },
        },
      }) as OpenAPISpec,
    }
  } catch (error) {
    return {
      ok: false,
      diagnostic: {
        kind: 'openapi',
        title: 'OpenAPI spec parse failed',
        message: `Clarify could not parse ${filePath}.`,
        filePath,
        details: errorMessage(error),
      },
    }
  }
}


export async function prepareOpenAPIRoutes(routes: ContentRoute[], contentProcessor?: ContentProcessor, projectRoot?: string): Promise<ContentRoute[]> {
  const nextRoutes = routes.map(route => ({ ...route }))
  const specs = new Map<string, OpenAPISpec>()
  const specFileKeys = new Map<string, string>()

  for (const route of nextRoutes.filter(route => route.kind === 'openapi')) {
    const specFromCache = specs.get(route.filePath)
    const result = specFromCache ? { ok: true as const, spec: specFromCache } : await readOpenAPISpec(route.filePath, contentProcessor)
    if (!result.ok) {
      route.document = createContentDocument({ path: route.path, title: route.title, filePath: route.filePath, kind: route.kind, basePath: route.basePath, locale: route.locale, isFallback: route.isFallback, isBareAlias: route.isBareAlias, alternates: route.alternates, virtualModuleId: route.virtualModuleId }, [], { diagnostic: result.diagnostic })
      route.title = route.title || 'OpenAPI parse error'
      route.document = syncContentDocumentRoute(route)
      continue
    }

    const spec = result.spec
    specs.set(route.filePath, spec)

    const specKey = specFileKeyFromPath(route.filePath, projectRoot)
    specFileKeys.set(route.filePath, specKey)
    const pageSpec = route.openapi?.tagFilter?.length ? filterSpecByTags(spec, route.openapi.tagFilter) : spec
    const sections = extractOpenAPISections(pageSpec, route.openapi?.tagFilter)
    route.title = spec.info?.title ?? route.title
    route.document = buildOpenAPIContentDocument(route, pageSpec, specKey, {
      description: spec.info?.description ?? undefined,
      sections,
    })
    route.document = syncContentDocumentRoute(route)
    route.source = {
      ...route.source,
      content: JSON.stringify(pageSpec),
    }
  }

  return nextRoutes
}

function specFileKeyFromPath(filePath: string, projectRoot?: string): string {
  if (!projectRoot) return filePath.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
  return relative(projectRoot, filePath).replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
}
