import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { copyTemplateDirectory, getTemplateDirectory, resolveTemplate } from '@clarify-labs/templates'

import type { ResolvedCliOptions } from '../options.js'
import { cliPackageVersionWithCaret } from '../package.js'

const require = createRequire(import.meta.url)

function findTemplatesPackagePath(): string {
  try {
    return require.resolve('@clarify-labs/templates/package.json')
  } catch {
    const currentDirectory = dirname(fileURLToPath(import.meta.url))
    const workspacePackagePath = resolve(currentDirectory, '../../../../templates/package.json')
    if (existsSync(workspacePackagePath)) return workspacePackagePath
    throw new Error('[clarify] Templates package not found.')
  }
}

const templatesPackagePath = findTemplatesPackagePath()
const templatesDirectory = dirname(templatesPackagePath)

function updatePackageJson(root: string, force: boolean): boolean {
  const packageJsonPath = resolve(root, 'package.json')
  const packageJson = existsSync(packageJsonPath)
    ? JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as Record<string, unknown>
    : { type: 'module' }

  const scripts = typeof packageJson.scripts === 'object' && packageJson.scripts !== null
    ? packageJson.scripts as Record<string, string>
    : {}

  if (force || !scripts.dev) scripts.dev = 'clarify dev'
  if (force || !scripts.build) scripts.build = 'clarify build'
  packageJson.scripts = scripts

  const devDependencies = typeof packageJson.devDependencies === 'object' && packageJson.devDependencies !== null
    ? packageJson.devDependencies as Record<string, string>
    : {}
  if (!devDependencies['@clarify-labs/cli']) devDependencies['@clarify-labs/cli'] = cliPackageVersionWithCaret
  packageJson.devDependencies = devDependencies

  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf-8')
  return true
}

export function runInit(options: ResolvedCliOptions, force: boolean, template?: string): void {
  const selectedTemplate = resolveTemplate(template)
  const templateDirectory = getTemplateDirectory(templatesDirectory, selectedTemplate)
  const { created } = copyTemplateDirectory(templateDirectory, options.root, {
    contentDir: options.content,
    force,
  })

  const packageJsonUpdated = updatePackageJson(options.root, force)
  if (packageJsonUpdated) created.push('package.json')

  console.log(`[clarify] Init complete with ${selectedTemplate} template.`)
  if (created.length > 0) console.log(`[clarify] Created or updated: ${created.join(', ')}`)
}
