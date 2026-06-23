import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export function createClarifyTempDir(name: string): string {
  return mkdtempSync(join(tmpdir(), `clarify-${name}-`))
}

export function removeClarifyTempDir(path: string | undefined): void {
  if (!path) return
  rmSync(path, { recursive: true, force: true })
}
