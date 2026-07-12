import { isAbsolute, relative } from 'node:path'

import type { ContentDiagnostic } from '@clarify-labs/renderer'

type CreateContentDiagnosticOptions = {
  kind: ContentDiagnostic['kind']
  title: string
  message: string
  error: unknown
  filePath?: string
  projectRoot?: string
  includeStack?: boolean
}

function displayPath(filePath: string | undefined, projectRoot: string | undefined): string | undefined {
  if (!filePath) return undefined
  if (!projectRoot) return filePath.replace(/^[A-Za-z]:\//, '').replace(/^\/+/, '')

  const normalized = relative(projectRoot, filePath)
  return normalized && !normalized.startsWith('..') && !isAbsolute(normalized)
    ? normalized
    : filePath.replace(/^[A-Za-z]:\//, '').replace(/^\/+/, '')
}

export function createContentDiagnostic(options: CreateContentDiagnosticOptions): ContentDiagnostic {
  const { error } = options
  return {
    kind: options.kind,
    title: options.title,
    message: options.message,
    filePath: displayPath(options.filePath, options.projectRoot),
    details: error instanceof Error
      ? options.includeStack ? error.stack ?? error.message : error.message
      : String(error),
  }
}
