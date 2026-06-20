import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'

export const supportedTemplates = ['minimal', 'standard', 'complete'] as const

export type ClarifyTemplate = typeof supportedTemplates[number]

export type TemplateVariables = {
  contentDir: string
}

export type TemplateCopyOptions = {
  contentDir: string
  force?: boolean
  variables?: Partial<TemplateVariables>
}

export type TemplateCopyResult = {
  created: string[]
}

export class TemplateConflictError extends Error {
  constructor(public readonly conflicts: string[]) {
    super(`[clarify] Init target has conflicting files:\n${conflicts.map(file => `  - ${file}`).join('\n')}\nUse --force to overwrite them.`)
    this.name = 'TemplateConflictError'
  }
}

export function resolveTemplate(template?: string): ClarifyTemplate {
  const selectedTemplate = template ?? 'standard'
  if (supportedTemplates.includes(selectedTemplate as ClarifyTemplate)) return selectedTemplate as ClarifyTemplate
  throw new Error(`[clarify] Unknown template "${selectedTemplate}". Available templates: ${supportedTemplates.join(', ')}.`)
}

export function getTemplateDirectory(templatesDirectory: string, template: ClarifyTemplate): string {
  return resolve(templatesDirectory, template)
}

export function renderTemplate(content: string, variables: TemplateVariables): string {
  return content.replaceAll('{{contentDir}}', variables.contentDir)
}

export function toTemplateTargetPath(relativePath: string, contentDir: string): string {
  return relativePath.replace(/^source(?=\/|$)/, contentDir)
}

export function copyTemplateDirectory(templateDirectory: string, targetDirectory: string, options: TemplateCopyOptions): TemplateCopyResult {
  const created: string[] = []
  const variables = {
    contentDir: options.contentDir,
    ...options.variables,
  }

  if (options.force !== true) {
    const conflicts = findTemplateConflicts(templateDirectory, targetDirectory, options.contentDir)
    if (conflicts.length > 0) throw new TemplateConflictError(conflicts)
  }

  copyDirectory(templateDirectory, templateDirectory, targetDirectory, options.contentDir, variables, created)

  return { created }
}

function findTemplateConflicts(templateDirectory: string, targetDirectory: string, contentDir: string): string[] {
  const conflicts: string[] = []
  collectTemplateConflicts(templateDirectory, templateDirectory, targetDirectory, contentDir, conflicts)
  return conflicts
}

function collectTemplateConflicts(templateDirectory: string, sourceDirectory: string, targetDirectory: string, contentDir: string, conflicts: string[]): void {
  for (const entry of readdirSync(sourceDirectory, { withFileTypes: true })) {
    const sourcePath = resolve(sourceDirectory, entry.name)
    const sourceRelativePath = relative(templateDirectory, sourcePath)
    const targetRelativePath = toTemplateTargetPath(sourceRelativePath, contentDir)
    const targetPath = resolve(targetDirectory, targetRelativePath)

    if (entry.isDirectory()) {
      collectTemplateConflicts(templateDirectory, sourcePath, targetDirectory, contentDir, conflicts)
      continue
    }

    if (entry.isFile() && existsSync(targetPath)) conflicts.push(targetRelativePath)
  }
}

function copyDirectory(templateDirectory: string, sourceDirectory: string, targetDirectory: string, contentDir: string, variables: TemplateVariables, created: string[]): void {
  for (const entry of readdirSync(sourceDirectory, { withFileTypes: true })) {
    const sourcePath = resolve(sourceDirectory, entry.name)
    const sourceRelativePath = relative(templateDirectory, sourcePath)
    const targetRelativePath = toTemplateTargetPath(sourceRelativePath, contentDir)
    const targetPath = resolve(targetDirectory, targetRelativePath)

    if (entry.isDirectory()) {
      copyDirectory(templateDirectory, sourcePath, targetDirectory, contentDir, variables, created)
      continue
    }

    if (!entry.isFile()) continue

    const content = renderTemplate(readFileSync(sourcePath, 'utf-8'), variables)
    mkdirSync(dirname(targetPath), { recursive: true })
    writeFileSync(targetPath, content, 'utf-8')
    created.push(targetRelativePath)
  }
}
