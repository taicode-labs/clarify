import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function readPackageVersion(): string {
  try {
    const currentDirectory = dirname(fileURLToPath(import.meta.url))
    const packageJsonPaths = [
      resolve(currentDirectory, '../package.json'),
      resolve(currentDirectory, '../../package.json'),
      resolve(currentDirectory, '../packages/cli/package.json'),
    ]
    const packageJsonPath = packageJsonPaths.find(path => existsSync(path))
    if (!packageJsonPath) return '0.0.0'

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as { version?: string }
    return packageJson.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}
