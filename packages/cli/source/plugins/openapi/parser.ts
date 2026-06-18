import { existsSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

import SwaggerParser from '@apidevtools/swagger-parser'
import { slug } from 'github-slugger'

import { routePathFromRef, virtualModuleIdFromRef } from '../../parsers/routes.js'
import type { ContentRoute, ContentSection, OpenAPISpec } from '../../types.js'

const OPENAPI_HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const

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
    })
  }

  return routes
}

/** Extract endpoint operations from an OpenAPI spec as page sections. */
export function extractOpenAPISections(spec: OpenAPISpec): ContentSection[] {
  const sections: ContentSection[] = []
  const paths = spec.paths ?? {}
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue
    for (const method of OPENAPI_HTTP_METHODS) {
      const op = pathItem[method]
      if (!op) continue
      const title = op.summary ?? `${method.toUpperCase()} ${path}`
      sections.push({ id: slug(`${method} ${path}`), title, level: 2, badge: method.toUpperCase() })
    }
  }
  return sections
}

export async function readOpenAPISpec(filePath: string): Promise<OpenAPISpec | null> {
  try {
    return await SwaggerParser.dereference(filePath) as OpenAPISpec
  } catch {
    return null
  }
}
