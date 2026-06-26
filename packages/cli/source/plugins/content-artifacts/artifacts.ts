import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { stringify as yamlStringify } from 'yaml'

import type { ContentRoute, ResolvedProjectConfig } from '../../types.js'

const UTF8_SIGNATURE = '\uFEFF'

function normalizeBasePath(basePath: string): string {
  if (!basePath || basePath === '/') return ''
  return '/' + basePath.replace(/^\/+|\/+$/g, '')
}

function containsNonAscii(content: string): boolean {
  return [...content].some(character => character.codePointAt(0)! > 0x7F)
}

function withUtf8Signature(content: string): string {
  if (!containsNonAscii(content) || content.startsWith(UTF8_SIGNATURE)) return content
  return `${UTF8_SIGNATURE}${content}`
}

function shouldUseUtf8Signature(route: ContentRoute): boolean {
  if (route.kind === 'mdx') return true
  return false
}

export function routeToMarkdownArtifactUrl(routePath: string): string {
  const normalizedPath = routePath === '/' ? '/index' : routePath.replace(/\/$/, '')
  return `${normalizedPath}.md`
}

export function routeToOpenAPIArtifactUrl(routePath: string): string {
  const normalizedPath = routePath === '/' ? '/index' : routePath.replace(/\/$/, '')
  return `${normalizedPath}.openapi.json`
}

export function attachContentArtifactUrls(routes: ContentRoute[]): void {
  for (const route of routes) {
    route.contentArtifactUrl = route.kind === 'openapi'
      ? routeToOpenAPIArtifactUrl(route.path)
      : routeToMarkdownArtifactUrl(route.path)
  }
}

export function readRouteContent(route: ContentRoute): string {
  if (route.content !== undefined) return route.content
  throw new Error(`Route content is missing from route context: ${route.filePath}`)
}

export function readRouteArtifactContent(route: ContentRoute): string {
  const content = readRouteContent(route)
  return shouldUseUtf8Signature(route) ? withUtf8Signature(content) : content
}

export function writeContentArtifactFiles(routes: ContentRoute[], outputDirectory: string): void {
  for (const route of routes) {
    if (!route.contentArtifactUrl) continue

    const outFile = join(outputDirectory, route.contentArtifactUrl.replace(/^\//, ''))
    mkdirSync(dirname(outFile), { recursive: true })
    writeFileSync(outFile, readRouteArtifactContent(route), 'utf-8')

    // For OpenAPI routes, also write a YAML variant
    if (route.kind === 'openapi' && route.content) {
      const yamlOutFile = outFile.replace(/\.json$/, '.yaml')
      const spec = JSON.parse(route.content)
      writeFileSync(yamlOutFile, yamlStringify(spec, { lineWidth: 0 }), 'utf-8')
    }
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
    if (!route.contentArtifactUrl) continue
    lines.push(`- [${route.title}](${basePath}${route.contentArtifactUrl})`)
  }

  const openApiRoutes = routes.filter(route => route.kind === 'openapi')
  if (openApiRoutes.length > 0) {
    lines.push('', '## OpenAPI')
    for (const route of openApiRoutes) {
      if (!route.contentArtifactUrl) continue
      lines.push(`- [${route.title}](${basePath}${route.contentArtifactUrl})`)
    }
  }

  return `${lines.join('\n')}\n`
}

export function createLlmsTxtArtifact(routes: ContentRoute[], projectConfig: ResolvedProjectConfig): string {
  return withUtf8Signature(createLlmsTxt(routes, projectConfig))
}

export function writeLlmsTxt(routes: ContentRoute[], projectConfig: ResolvedProjectConfig, outputDirectory: string): void {
  mkdirSync(outputDirectory, { recursive: true })
  writeFileSync(join(outputDirectory, 'llms.txt'), createLlmsTxtArtifact(routes, projectConfig), 'utf-8')
}
