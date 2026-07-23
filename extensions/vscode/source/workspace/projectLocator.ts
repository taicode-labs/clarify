import { existsSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

import { BOOTSTRAP_CONVENTIONS, type ProjectConventions } from './conventions'

export function isContentFile(filePath: string, conventions: ProjectConventions = BOOTSTRAP_CONVENTIONS): boolean {
  const lower = filePath.toLowerCase()
  return conventions.contentFileExtensions.some(extension => lower.endsWith(extension))
}

export function findClarifyProjectRoot(filePath: string, conventions: ProjectConventions = BOOTSTRAP_CONVENTIONS): string | undefined {
  let directory = dirname(filePath)
  let previous: string | undefined

  while (directory && directory !== previous) {
    for (const filename of conventions.configFilenames) {
      if (existsSync(join(directory, filename))) return directory
    }
    previous = directory
    directory = dirname(directory)
  }

  return undefined
}

export function resolveClarifyContentFile(filePath: string, conventions: ProjectConventions = BOOTSTRAP_CONVENTIONS): { projectRoot: string } | undefined {
  if (!isContentFile(filePath, conventions)) return undefined

  const projectRoot = findClarifyProjectRoot(filePath, conventions)
  if (!projectRoot) return undefined

  const contentRoot = join(projectRoot, conventions.contentRoot)
  const relativePath = relative(contentRoot, filePath)
  if (!relativePath || relativePath.startsWith('..')) return undefined

  return { projectRoot }
}
