import { relative } from 'node:path'

import type { ClarifyRepositoryConfig, ContentRoute } from '../../types.js'

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '')
}

function normalizeRepositoryUrl(repository: string): string {
  return repository.replace(/\.git$/, '').replace(/\/+$/, '')
}

function encodePath(path: string): string {
  return path
    .split('/')
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join('/')
}

export function createSourceEditUrl(filePath: string, contentRoot: string, source: ClarifyRepositoryConfig): string {
  if (!source.url) return ''
  const repository = normalizeRepositoryUrl(source.url)
  const branch = source.branch ?? 'main'
  const directory = source.directory ? trimSlashes(source.directory) : ''
  const relativePath = relative(contentRoot, filePath).replaceAll('\\', '/')
  const sourcePath = [directory, relativePath].filter(Boolean).join('/')
  return `${repository}/edit/${encodeURIComponent(branch)}/${encodePath(sourcePath)}`
}

export function attachSourceEditUrls(routes: ContentRoute[], contentRoot: string, source?: ClarifyRepositoryConfig): void {
  if (!source) return
  for (const route of routes) {
    route.source = {
      ...route.source,
      sourceEditUrl: createSourceEditUrl(route.source.filePath, contentRoot, source),
    }
  }
}
