import { existsSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

import {
  BOOTSTRAP_CONFIG_FILENAMES,
  BOOTSTRAP_CONTENT_EXTENSIONS,
  BOOTSTRAP_CONTENT_ROOT,
  type ProjectInfo,
} from './projectInfo'

// ─────────────────────────────────────────────────────────────────────────────
// Local CLI binary resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Candidate relative paths for a locally available `clarify` binary.
 *
 * 1. `packages/cli/bin/clarify.js` — monorepo development mode: use the CLI
 *    built from source so unreleased changes are picked up immediately.
 * 2. `node_modules/.bin/clarify` — standard local install (project root or
 *    any ancestor that hoisted the bin).
 * 3. `node_modules/@clarify-labs/cli/bin/clarify.js` — explicit dependency
 *    install without a `.bin` symlink (rare, but some package managers do this).
 */
const LOCAL_BIN_CANDIDATES = [
  'packages/cli/bin/clarify.js',
  'node_modules/.bin/clarify',
  'node_modules/@clarify-labs/cli/bin/clarify.js',
] as const

/**
 * Resolve a locally available `clarify` binary path, searching from
 * `projectRoot` up through ancestor directories.
 *
 * Returns the absolute path to the first matching binary, or `undefined`
 * when no local CLI is found. This is used by the dev server to prefer a
 * local (especially monorepo source) CLI over the extension-managed install
 * — critical for testing unreleased changes during extension development.
 */
export function resolveLocalClarifyBin(projectRoot: string): string | undefined {
  let dir: string | undefined = projectRoot
  let prev: string | undefined
  while (dir && dir !== prev) {
    for (const candidate of LOCAL_BIN_CANDIDATES) {
      const candidatePath = join(dir, candidate)
      if (existsSync(candidatePath)) {
        return candidatePath
      }
    }
    prev = dir
    dir = dirname(dir)
  }
  return undefined
}

/**
 * Resolved conventions used to identify Clarify projects and content files.
 *
 * Before the dev server is running these fall back to bootstrap defaults
 * (mirroring the CLI's current defaults). Once `/dev/project-info` has been
 * queried, the authoritative values from the running CLI replace them.
 */
export type ProjectConventions = {
  configFilenames: readonly string[]
  contentFileExtensions: readonly string[]
  contentRoot: string
}

/** Bootstrap conventions used before the dev server is reachable. */
export const BOOTSTRAP_CONVENTIONS: ProjectConventions = {
  configFilenames: BOOTSTRAP_CONFIG_FILENAMES,
  contentFileExtensions: BOOTSTRAP_CONTENT_EXTENSIONS,
  contentRoot: BOOTSTRAP_CONTENT_ROOT,
}

/** Build conventions from a fetched `ProjectInfo` payload. */
export function conventionsFromProjectInfo(info: ProjectInfo): ProjectConventions {
  return {
    configFilenames: info.configFilenames,
    contentFileExtensions: info.contentFileExtensions,
    contentRoot: info.contentRoot,
  }
}

/**
 * Quick local check for whether a file is a Clarify content file, based on the
 * given conventions. Used to decide whether to hit the route endpoint at all.
 */
export function isContentFile(filePath: string, conventions: ProjectConventions = BOOTSTRAP_CONVENTIONS): boolean {
  const lower = filePath.toLowerCase()
  return conventions.contentFileExtensions.some(ext => lower.endsWith(ext))
}

/**
 * Walk up the directory tree from `filePath` looking for a Clarify config file.
 * Returns the absolute path of the directory that contains the config, or
 * `undefined` if no config is found before reaching the filesystem root.
 *
 * This intentionally does NOT consult `package.json` — only the presence of a
 * config file listed in `conventions.configFilenames` marks a folder as a
 * Clarify project.
 */
export function findClarifyProjectRoot(filePath: string, conventions: ProjectConventions = BOOTSTRAP_CONVENTIONS): string | undefined {
  let dir = dirname(filePath)
  // Guard against infinite loops on weird paths.
  let prev: string | undefined
  while (dir && dir !== prev) {
    for (const filename of conventions.configFilenames) {
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
 *   1. It matches one of the configured content file extensions.
 *   2. A Clarify config file exists in some ancestor directory.
 *   3. The file is located under that project's content root directory
 *      (`source` by default — see `rootDirectory` in the CLI options).
 *
 * Returns the project root when all checks pass, otherwise `undefined`.
 */
export function resolveClarifyContentFile(filePath: string, conventions: ProjectConventions = BOOTSTRAP_CONVENTIONS): { projectRoot: string } | undefined {
  if (!isContentFile(filePath, conventions)) return undefined

  const projectRoot = findClarifyProjectRoot(filePath, conventions)
  if (!projectRoot) return undefined

  const contentRoot = join(projectRoot, conventions.contentRoot)
  const rel = relative(contentRoot, filePath)
  // If the relative path starts with `..` or is absolute, the file is outside
  // the content root and should not get a preview button.
  if (!rel || rel.startsWith('..') || rel.startsWith(projectRoot)) {
    return undefined
  }
  return { projectRoot }
}
