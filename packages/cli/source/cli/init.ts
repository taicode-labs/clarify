import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import type { ResolvedCliOptions } from './options.js'

function writeTextFile(filePath: string, content: string, force: boolean): boolean {
  if (existsSync(filePath) && !force) return false
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, content, 'utf-8')
  return true
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
  if (!devDependencies['@clarify/cli']) devDependencies['@clarify/cli'] = '^0.1.0'
  packageJson.devDependencies = devDependencies

  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf-8')
  return true
}

export function runInit(options: ResolvedCliOptions, force: boolean): void {
  const created: string[] = []
  const skipped: string[] = []

  const clarifyConfigCreated = writeTextFile(resolve(options.root, 'clarify.ts'), `import { defineConfig } from '@clarify/cli'

export default defineConfig({
  title: 'Clarify Docs',
  description: 'Documentation powered by Clarify',
  theme: { primary: '#0ea5e9' },
})
`, force)
  ;(clarifyConfigCreated ? created : skipped).push('clarify.ts')

  const contentCreated = writeTextFile(resolve(options.root, options.content, 'index.mdx'), `---
title: Welcome
---

# Welcome to Clarify

Start writing your documentation in \`${options.content}\`.
`, force)
  ;(contentCreated ? created : skipped).push(`${options.content}/index.mdx`)

  const packageJsonUpdated = updatePackageJson(options.root, force)
  if (packageJsonUpdated) created.push('package.json')

  console.log('[clarify] Init complete.')
  if (created.length > 0) console.log(`[clarify] Created or updated: ${created.join(', ')}`)
  if (skipped.length > 0) console.log(`[clarify] Skipped existing files: ${skipped.join(', ')}. Use --force to overwrite.`)
}
