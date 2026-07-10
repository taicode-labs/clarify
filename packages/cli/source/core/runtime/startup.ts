import { relative } from 'node:path'

export type StartupHintOptions = {
  projectRoot: string
  contentRoot: string
  contentDirExists: boolean
  hasRoutes: boolean
}

function contentDirectoryLabel(projectRoot: string, contentRoot: string): string {
  const relativePath = relative(projectRoot, contentRoot)
  return relativePath && relativePath !== '.' ? relativePath : 'source'
}

function contentFileExampleLabel(projectRoot: string, contentRoot: string): string {
  return `${contentDirectoryLabel(projectRoot, contentRoot)}/index.mdx`
}

export function getStartupHints(options: StartupHintOptions): string[] {
  const hints: string[] = []

  if (!options.contentDirExists) {
    const label = contentDirectoryLabel(options.projectRoot, options.contentRoot)
    hints.push(`Content directory "${label}" was not found. Create it or pass --content <dir> to point Clarify at a different directory.`)
  } else if (!options.hasRoutes) {
    const example = contentFileExampleLabel(options.projectRoot, options.contentRoot)
    hints.push(`No content pages were found yet. Add ${example} to get started.`)
  }

  return hints
}

export function logStartupHints(options: StartupHintOptions): void {
  const hints = getStartupHints(options)
  if (hints.length === 0) return

  const message = hints.map(hint => `[clarify] ${hint}`).join('\n')
  console.warn(message)
}
