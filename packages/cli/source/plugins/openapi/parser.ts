import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import SwaggerParser from '@apidevtools/swagger-parser'
import { slug } from 'github-slugger'

import type { ContentProcessor } from '../../parsers/content/content.js'
import { kebabToTitle, routePathFromRef, virtualModuleIdFromRef } from '../../parsers/routes/routes.js'
import type { ContentDiagnostic, ContentRoute, ContentSection, OpenAPISpec } from '../../types.js'

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

    const ref = relative(base, fullPath)
    const cleanPath = routePathFromRef(ref)
    routes.push({
      path: cleanPath,
      basePath: cleanPath,
      kind: 'openapi',
      meta: {
        title: kebabToTitle(cleanPath.split('/').pop() ?? 'API'),
      },
      module: {
        virtualModuleId: virtualModuleIdFromRef(ref),
      },
      source: {
        filePath: fullPath,
      },
    })
  }

  return routes
}

function operationMatchesTags(operationTags: string[] | undefined, filterTags: string[] | undefined): boolean {
  if (!filterTags?.length) return true
  return operationTags?.some(tag => filterTags.includes(tag)) ?? false
}

function filterPathItemsByTags(items: Record<string, unknown>, tags: string[]): Record<string, unknown> {
  const filteredItems: Record<string, unknown> = {}
  for (const path of Object.keys(items)) {
    const pathItem = items[path] as Record<string, unknown> | undefined
    if (!pathItem) continue
    const ops = OPENAPI_HTTP_METHODS.map(method => pathItem[method])
    const hasMatch = ops.some(op => op && typeof op === 'object' && operationMatchesTags((op as Record<string, unknown>).tags as string[] | undefined, tags))
    if (hasMatch) filteredItems[path] = pathItem
  }
  return filteredItems
}

/** Filter an OpenAPI spec to only include paths that have at least one operation matching the given tags. */
export function filterSpecByTags(spec: OpenAPISpec, tags: string[]): OpenAPISpec {
  const paths = (spec.paths ?? {}) as Record<string, unknown>
  const webhooks = ((spec as Record<string, unknown>).webhooks ?? {}) as Record<string, unknown>
  return { ...spec, paths: filterPathItemsByTags(paths, tags), webhooks: filterPathItemsByTags(webhooks, tags) } as OpenAPISpec
}

/** Extract endpoint operations from an OpenAPI spec as page sections. */
export function extractOpenAPISections(spec: OpenAPISpec, filterTags?: string[]): ContentSection[] {
  const sections: ContentSection[] = []
  const items = [
    ...Object.entries(spec.paths ?? {}).map(([path, pathItem]) => ({ path, pathItem, kind: 'path' })),
    ...Object.entries(((spec as Record<string, unknown>).webhooks ?? {}) as Record<string, unknown>).map(([path, pathItem]) => ({ path, pathItem, kind: 'webhook' })),
  ]
  for (const { path, pathItem, kind } of items) {
    if (!pathItem) continue
    const operations = pathItem as Record<string, unknown>
    for (const method of OPENAPI_HTTP_METHODS) {
      const op = operations[method] as Record<string, unknown> | undefined
      const tags = Array.isArray(op?.tags) ? op.tags as string[] : undefined
      if (!op || !operationMatchesTags(tags, filterTags)) continue
      const title = typeof op.summary === 'string' ? op.summary : `${method.toUpperCase()} ${path}`
      sections.push({ id: slug(`${kind === 'webhook' ? 'webhook ' : ''}${method} ${path}`), title, level: 2, badge: kind === 'webhook' ? 'WEBHOOK' : method.toUpperCase(), tags })
    }
  }
  return sections
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
