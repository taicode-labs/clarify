import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function readPackageVersion(): string {
  try {
    const packageJsonPath = resolve(dirname(fileURLToPath(import.meta.url)), '../package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as { version?: string }
    return packageJson.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}
