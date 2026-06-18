import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'

import type { ContentRoute, ResolvedProjectConfig } from '../../types.js'

function normalizeBasePath(basePath: string): string {
  if (!basePath || basePath === '/') return ''
  return '/' + basePath.replace(/^\/+|\/+$/g, '')
}

export function routeToMarkdownUrl(routePath: string): string {
  const normalizedPath = routePath === '/' ? '/index' : routePath.replace(/\/$/, '')
  return `${normalizedPath}.md`
}

export function routeToOpenAPIUrl(routePath: string, filePath: string): string {
  const extension = extname(filePath).toLowerCase() || '.json'
  const normalizedPath = routePath === '/' ? '/index' : routePath.replace(/\/$/, '')
  return `${normalizedPath}.openapi${extension}`
}

export function enrichRoutesWithRawContent(routes: ContentRoute[]): void {
  for (const route of routes) {
    route.rawContentUrl = route.kind === 'openapi'
      ? routeToOpenAPIUrl(route.path, route.filePath)
      : routeToMarkdownUrl(route.path)
  }
}

export function readRawContent(route: ContentRoute): string {
  return readFileSync(route.filePath, 'utf-8')
}

export function writeRawContentFiles(routes: ContentRoute[], outputDirectory: string): void {
  for (const route of routes) {
    if (!route.rawContentUrl) continue

    const outFile = join(outputDirectory, route.rawContentUrl.replace(/^\//, ''))
    mkdirSync(dirname(outFile), { recursive: true })
    writeFileSync(outFile, readRawContent(route), 'utf-8')
  }
}

export function createLlmsTxt(routes: ContentRoute[], projectConfig: ResolvedProjectConfig): string {
  const basePath = normalizeBasePath(projectConfig.routePrefix)
  const lines = [
    `# ${projectConfig.title}`,
    '',
  ]

  if (projectConfig.description) {
    lines.push(`> ${projectConfig.description}`, '')
  }

  lines.push('## Docs')
  for (const route of routes.filter(route => route.kind === 'mdx')) {
    if (!route.rawContentUrl) continue
    lines.push(`- [${route.title}](${basePath}${route.rawContentUrl})`)
  }

  const openApiRoutes = routes.filter(route => route.kind === 'openapi')
  if (openApiRoutes.length > 0) {
    lines.push('', '## OpenAPI')
    for (const route of openApiRoutes) {
      if (!route.rawContentUrl) continue
      lines.push(`- [${route.title}](${basePath}${route.rawContentUrl})`)
    }
  }

  return `${lines.join('\n')}\n`
}

export function writeLlmsTxt(routes: ContentRoute[], projectConfig: ResolvedProjectConfig, outputDirectory: string): void {
  mkdirSync(outputDirectory, { recursive: true })
  writeFileSync(join(outputDirectory, 'llms.txt'), createLlmsTxt(routes, projectConfig), 'utf-8')
}
