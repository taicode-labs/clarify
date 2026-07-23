import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

const LOCAL_BIN_CANDIDATES = [
  'packages/cli/bin/clarify.js',
  'node_modules/.bin/clarify',
  'node_modules/@clarify-labs/cli/bin/clarify.js',
] as const

/** Resolve a locally available Clarify CLI, searching through ancestor directories. */
export function resolveLocalClarifyBin(projectRoot: string): string | undefined {
  let directory: string | undefined = projectRoot
  let previous: string | undefined

  while (directory && directory !== previous) {
    for (const candidate of LOCAL_BIN_CANDIDATES) {
      const candidatePath = join(directory, candidate)
      if (existsSync(candidatePath)) return candidatePath
    }
    previous = directory
    directory = dirname(directory)
  }

  return undefined
}
