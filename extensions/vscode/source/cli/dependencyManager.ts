import { spawn } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { mkdtemp, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'

import * as vscode from 'vscode'

const CLARIFY_NPM_PACKAGE = '@clarify-labs/cli'

/** Manages a private, extension-owned installation of the Clarify CLI. */
export class DependencyManager {
  private installPromise?: { version: string; promise: Promise<void> }

  constructor(private readonly context: vscode.ExtensionContext) {}

  get installDir(): string {
    return join(this.context.globalStorageUri.fsPath, 'cli')
  }

  private get activeDir(): string {
    return join(this.installDir, 'current')
  }

  get binPath(): string {
    const binName = process.platform === 'win32' ? 'clarify.cmd' : 'clarify'
    return join(this.activeDir, 'node_modules', '.bin', binName)
  }

  getInstalledVersion(): string | undefined {
    const packagePath = join(
      this.activeDir,
      'node_modules',
      CLARIFY_NPM_PACKAGE,
      'package.json',
    )
    if (!existsSync(packagePath)) return undefined

    try {
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8')) as { version?: string }
      return packageJson.version
    } catch {
      return undefined
    }
  }

  isVersionInstalled(version: string): boolean {
    const installedVersion = this.getInstalledVersion()
    if (!installedVersion || !existsSync(this.binPath)) return false
    return version === 'latest' || installedVersion === version
  }

  async getLatestVersion(): Promise<string | undefined> {
    try {
      const output = await this.runNpm(['view', CLARIFY_NPM_PACKAGE, 'version', '--json'])
      const version = JSON.parse(output) as unknown
      return typeof version === 'string' ? version : undefined
    } catch (error) {
      console.warn('[clarify] Failed to check for CLI updates:', error)
      return undefined
    }
  }

  async ensureInstalled(version: string): Promise<void> {
    if (this.isVersionInstalled(version)) return

    if (this.installPromise?.version === version) {
      await this.installPromise.promise
      return
    }

    if (this.installPromise) {
      await this.installPromise.promise.catch(() => {})
      if (this.isVersionInstalled(version)) return
    }

    const promise = this.install(version).finally(() => {
      if (this.installPromise?.promise === promise) this.installPromise = undefined
    })
    this.installPromise = { version, promise }
    await promise
  }

  private async install(version: string): Promise<void> {
    mkdirSync(this.installDir, { recursive: true })

    const installedVersion = this.getInstalledVersion()
    const title = installedVersion
      ? `Clarify: upgrading CLI ${installedVersion} → ${version}...`
      : `Clarify: installing CLI ${version}...`

    const stagingDir = await mkdtemp(join(this.installDir, '.staging-'))
    try {
      writeFileSync(
        join(stagingDir, 'package.json'),
        JSON.stringify({ name: 'clarify-cli-store', private: true, version: '0.0.0' }, null, 2),
      )

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title,
          cancellable: false,
        },
        () => this.runNpmInstall(version, stagingDir),
      )

      if (!this.isInstalledAt(stagingDir, version)) {
        throw new Error(`installed Clarify CLI did not resolve to version ${version}`)
      }

      await this.activate(stagingDir)
    } catch (error) {
      await rm(stagingDir, { recursive: true, force: true })
      throw error
    }
  }

  private runNpmInstall(version: string, cwd: string): Promise<void> {
    return this.runNpm(['install', `${CLARIFY_NPM_PACKAGE}@${version}`], cwd).then(
      () => undefined,
    )
  }

  private isInstalledAt(directory: string, version: string): boolean {
    const packagePath = join(directory, 'node_modules', CLARIFY_NPM_PACKAGE, 'package.json')
    if (!existsSync(packagePath)) return false

    try {
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8')) as { version?: string }
      const binName = process.platform === 'win32' ? 'clarify.cmd' : 'clarify'
      return packageJson.version === version && existsSync(join(directory, 'node_modules', '.bin', binName))
    } catch {
      return false
    }
  }

  private async activate(stagingDir: string): Promise<void> {
    const backupDir = join(this.installDir, `.backup-${Date.now()}`)
    if (existsSync(this.activeDir)) await rename(this.activeDir, backupDir)

    try {
      await rename(stagingDir, this.activeDir)
    } catch (error) {
      if (existsSync(backupDir)) await rename(backupDir, this.activeDir)
      throw error
    }

    await rm(backupDir, { recursive: true, force: true })
  }

  private runNpm(args: string[], cwd?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
      const child = spawn(npmCommand, args, {
        cwd,
        env: { ...process.env },
      })

      let stdout = ''
      let stderr = ''
      child.stdout?.on('data', (chunk: Buffer) => {
        stdout += chunk.toString()
      })
      child.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString()
      })
      child.on('error', (error) => {
        reject(new Error(`failed to start npm: ${error.message}`))
      })
      child.on('exit', (code) => {
        if (code === 0) {
          resolve(stdout.trim())
          return
        }

        const details = stderr.trim().split('\n').slice(-10).join('\n')
        reject(
          new Error(`npm exited with code ${code}${details ? `\n${details}` : ''}`),
        )
      })
    })
  }
}
