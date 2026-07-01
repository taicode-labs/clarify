import { existsSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const CONTENT_FILE_PATTERN = /\.(md|mdx|openapi\.(json|ya?ml))$/i

/**
 * Config filenames Clarify CLI looks for at the project root.
 * Kept in sync with `packages/cli/source/core/user-config.ts`.
 */
const CLARIFY_CONFIG_FILENAMES = [
  'clarify.ts',
  'clarify.js',
  'clarify.mjs',
  'clarify.cjs',
  'clarify.json',
]

/**
 * Default content root directory name used by Clarify projects.
 * Kept in sync with `packages/cli/source/core/options.ts` (`rootDirectory`).
 */
const DEFAULT_CONTENT_ROOT = 'source'

/**
 * Quick local check for whether a file is a Clarify content file.
 * Used to decide whether to hit the route endpoint at all.
 */
export function isContentFile(filePath: string): boolean {
  return CONTENT_FILE_PATTERN.test(filePath)
}

/**
 * Walk up the directory tree from `filePath` looking for a Clarify config file.
 * Returns the absolute path of the directory that contains the config, or
 * `undefined` if no config is found before reaching the filesystem root.
 *
 * This intentionally does NOT consult `package.json` — only the presence of a
 * `clarify.{ts,js,mjs,cjs,json}` file marks a folder as a Clarify project.
 */
export function findClarifyProjectRoot(filePath: string): string | undefined {
  let dir = dirname(filePath)
  // Guard against infinite loops on weird paths.
  let prev: string | undefined
  while (dir && dir !== prev) {
    for (const filename of CLARIFY_CONFIG_FILENAMES) {
      if (existsSync(join(dir, filename))) {
        return dir
      }
    }
    prev = dir
    dir = dirname(dir)
  }
  return undefined
}

/**
 * Determine whether `filePath` lives inside a Clarify project's content root.
 *
 * A file is considered a Clarify content file when:
 *   1. It matches the content file pattern (.md/.mdx/.openapi.{json,yaml,yml}).
 *   2. A Clarify config file exists in some ancestor directory.
 *   3. The file is located under that project's content root directory
 *      (`source` by default — see `rootDirectory` in the CLI options).
 *
 * Returns the project root when all checks pass, otherwise `undefined`.
 */
export function resolveClarifyContentFile(filePath: string): { projectRoot: string } | undefined {
  if (!isContentFile(filePath)) return undefined

  const projectRoot = findClarifyProjectRoot(filePath)
  if (!projectRoot) return undefined

  const contentRoot = join(projectRoot, DEFAULT_CONTENT_ROOT)
  const rel = relative(contentRoot, filePath)
  // If the relative path starts with `..` or is absolute, the file is outside
  // the content root and should not get a preview button.
  if (!rel || rel.startsWith('..') || rel.startsWith(projectRoot)) {
    return undefined
  }
  return { projectRoot }
}
