import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

import SwaggerParser from '@apidevtools/swagger-parser'
import { slug } from 'github-slugger'

import { routePathFromRef, virtualModuleIdFromRef } from '../../parsers/routes.js'
import type { ContentDiagnostic, ContentRoute, ContentSection, OpenAPISpec } from '../../types.js'

const OPENAPI_HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const

export type OpenAPIParseResult =
  | { ok: true; spec: OpenAPISpec }
  | { ok: false; diagnostic: ContentDiagnostic }

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function kebabToTitle(str: string): string {
  return str
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
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
      filePath: fullPath,
      virtualModuleId: virtualModuleIdFromRef(ref),
      title: kebabToTitle(cleanPath.split('/').pop() ?? 'API'),
      kind: 'openapi',
      content: readFileSync(fullPath, 'utf-8'),
    })
  }

  return routes
}

function operationMatchesTags(operationTags: string[] | undefined, filterTags: string[] | undefined): boolean {
  if (!filterTags?.length) return true
  return operationTags?.some(tag => filterTags.includes(tag)) ?? false
}

/** Extract endpoint operations from an OpenAPI spec as page sections. */
export function extractOpenAPISections(spec: OpenAPISpec, filterTags?: string[]): ContentSection[] {
  const sections: ContentSection[] = []
  const paths = spec.paths ?? {}
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue
    for (const method of OPENAPI_HTTP_METHODS) {
      const op = pathItem[method]
      if (!op || !operationMatchesTags(op.tags, filterTags)) continue
      const title = op.summary ?? `${method.toUpperCase()} ${path}`
      sections.push({ id: slug(`${method} ${path}`), title, level: 2, badge: method.toUpperCase(), tags: op.tags })
    }
  }
  return sections
}

export async function readOpenAPISpec(filePath: string): Promise<OpenAPIParseResult> {
  try {
    return { ok: true, spec: await SwaggerParser.dereference(filePath) as OpenAPISpec }
  } catch (error) {
    return {
      ok: false,
      diagnostic: {
        title: 'OpenAPI spec parse failed',
        message: `Clarify could not parse ${filePath}.`,
        filePath,
        cause: errorMessage(error),
      },
    }
  }
}
