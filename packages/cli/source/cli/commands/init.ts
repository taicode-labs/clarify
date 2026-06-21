import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { copyTemplateDirectory, getTemplateDirectory, resolveTemplate } from '@clarify-labs/templates'
import { spawnSync } from '../spawn.js'

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

function commandExists(program: string): boolean {
  const result = spawnSync(program, ['--version'], { stdio: 'ignore' })
  return result.status === 0 && result.error === undefined
}

type InstallCommand = { command: string; args: string[] }

function getInstallCommand(): InstallCommand {
  if (commandExists('pnpm')) return { command: 'pnpm', args: ['install'] }
  if (commandExists('npm')) return { command: 'npm', args: ['install'] }
  if (commandExists('yarn')) return { command: 'yarn', args: ['install'] }
  return { command: 'npm', args: ['install'] }
}

function installDependencies(root: string): void {
  const { command, args } = getInstallCommand()
  console.log(`[clarify] Installing dependencies with ${command}...`)
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) {
    throw new Error(`[clarify] Dependency install failed with ${command}`)
  }
}

function getSuggestedInstallCommand(): string {
  if (commandExists('pnpm')) return 'pnpm install'
  if (commandExists('npm')) return 'npm install'
  if (commandExists('yarn')) return 'yarn install'
  return 'npm install'
}

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

export function runInit(options: ResolvedCliOptions, force: boolean, template?: string, install = false): void {
  const selectedTemplate = resolveTemplate(template)
  const templateDirectory = getTemplateDirectory(templatesDirectory, selectedTemplate)
  const { created } = copyTemplateDirectory(templateDirectory, options.root, {
    contentDir: options.content,
    force,
  })

  const packageJsonUpdated = updatePackageJson(options.root, force)
  if (packageJsonUpdated) created.push('package.json')

  console.log(`[clarify] Project scaffold created using the ${selectedTemplate} template.`)
  if (created.length > 0) {
    console.log(`[clarify] Created or updated ${created.length} ${created.length === 1 ? 'file' : 'files'}: ${created.join(', ')}`)
  }

  if (install) {
    installDependencies(options.root)
    console.log('[clarify] Dependencies installed successfully.')
    console.log('[clarify] You can now run `clarify dev` to start the local documentation server.')
    return
  }

  const suggestedInstall = getSuggestedInstallCommand()
  console.log('[clarify] Next steps:')
  console.log('  1. Change into your new project directory:')
  console.log(`       cd ${options.root}`)
  console.log('  2. Install dependencies:')
  console.log(`       ${suggestedInstall}`)
  console.log('  3. Start the local documentation server:')
  console.log('       clarify dev')
}
