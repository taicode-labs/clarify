import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import type { AliasOptions } from 'vite'

const requireFromCli = createRequire(import.meta.url)

function resolveCliDependency(id: string): string {
  return requireFromCli.resolve(id)
}

function resolvePackageExport(packageName: string, subpath: string, condition: 'import' | 'require' = 'import'): string {
  const packageJsonPath = requireFromCli.resolve(`${packageName}/package.json`)
  const packageRoot = dirname(packageJsonPath)
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
    exports?: Record<string, string | Record<string, string>>
  }
  const exportKey = subpath ? `./${subpath}` : '.'
  const exportEntry = packageJson.exports?.[exportKey]
  const target = typeof exportEntry === 'string'
    ? exportEntry
    : exportEntry?.[condition] ?? exportEntry?.default

  if (!target) {
    throw new Error(`[clarify] Unable to resolve ${packageName}/${subpath}`)
  }

  return join(packageRoot, target)
}

/**
 * Resolve Clarify's framework/runtime dependencies from the CLI package instead
 * of from the user's documentation project. This keeps content-only projects
 * free from React, renderer, and tsconfig requirements.
 */
export function createClarifyRuntimeAliases(): AliasOptions {
  return [
    { find: /^@clarify-labs\/renderer\/style\.css$/, replacement: resolvePackageExport('@clarify-labs/renderer', 'style.css') },
    { find: /^@clarify-labs\/renderer\/client$/, replacement: resolvePackageExport('@clarify-labs/renderer', 'client') },
    { find: /^@clarify-labs\/renderer\/server$/, replacement: resolvePackageExport('@clarify-labs/renderer', 'server') },
    { find: /^@clarify-labs\/renderer$/, replacement: resolvePackageExport('@clarify-labs/renderer', '') },
    { find: /^react\/jsx-dev-runtime$/, replacement: resolveCliDependency('react/jsx-dev-runtime') },
    { find: /^react\/jsx-runtime$/, replacement: resolveCliDependency('react/jsx-runtime') },
    { find: /^mermaid$/, replacement: resolveCliDependency('mermaid') },
    { find: /^react-zoom-pan-pinch$/, replacement: resolveCliDependency('react-zoom-pan-pinch') },
    { find: /^react$/, replacement: resolveCliDependency('react') },
  ]
}
