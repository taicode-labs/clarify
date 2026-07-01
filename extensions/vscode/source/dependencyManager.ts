import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'

import * as vscode from 'vscode'

const CLARIFY_NPM_PACKAGE = '@clarify-labs/cli'

/**
 * Manages a private, extension-owned install of `@clarify-labs/cli`.
 *
 * The CLI is installed under the extension's `globalStorage` directory so it
 * persists across workspace switches and editor restarts. This avoids the
 * latency and flakiness of `npx` fetching the package on every dev server
 * start, and mirrors how other tooling extensions (Prettier, ESLint, etc.)
 * manage their runtime dependencies.
 *
 * Binary resolution order (handled by `DevServerManager`):
 *   1. Workspace-local install (`<workspace>/node_modules/.bin/clarify`)
 *   2. Extension-managed install (this class's `binPath`)
 *   3. `npx` fallback
 */
export class DependencyManager {
  /** In-flight install keyed by version, so concurrent callers share one npm install. */
  private installPromise?: { version: string; promise: Promise<void> }

  constructor(private readonly context: vscode.ExtensionContext) {}

  /** Directory where the CLI is privately installed for this extension. */
  get installDir(): string {
    return join(this.context.globalStorageUri.fsPath, 'cli')
  }

  /** Path to the installed `clarify` binary (shell-resolved, works on Windows via .cmd). */
  get binPath(): string {
    return join(this.installDir, 'node_modules', '.bin', 'clarify')
  }

  /**
   * Returns the currently installed CLI version, or `undefined` when the
   * extension-managed install is missing or unreadable.
   */
  getInstalledVersion(): string | undefined {
    const pkgPath = join(this.installDir, 'node_modules', CLARIFY_NPM_PACKAGE, 'package.json')
    if (!existsSync(pkgPath)) return undefined
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string }
      return pkg.version
    } catch {
      return undefined
    }
  }

  /**
   * Returns `true` when the requested version is already installed.
   *
   * For `"latest"` we treat any existing install as sufficient — re-running
   * `npm install` on every activation would be wasteful. Users who want to
   * force an update can switch to a pinned version (which triggers a reinstall
   * when it doesn't match) or delete the extension's global storage.
   */
  isVersionInstalled(version: string): boolean {
    const installed = this.getInstalledVersion()
    if (!installed) return false
    if (version === 'latest') return true
    return installed === version
  }

  /**
   * Ensure the CLI is installed at the requested version.
   *
   * Concurrent calls for the same version share a single `npm install` process.
   * Calls for a different version while an install is in-flight wait for the
   * in-flight install to finish, then re-check.
   */
  async ensureInstalled(version: string): Promise<void> {
    if (this.isVersionInstalled(version)) return

    // If an install for this exact version is already running, await it.
    if (this.installPromise?.version === version) {
      await this.installPromise.promise
      return
    }

    // If an install for a different version is running, wait for it first,
    // then re-evaluate.
    if (this.installPromise) {
      await this.installPromise.promise.catch(() => {})
      if (this.isVersionInstalled(version)) return
    }

    const promise = this.doInstall(version).finally(() => {
      if (this.installPromise?.promise === promise) this.installPromise = undefined
    })
    this.installPromise = { version, promise }
    await promise
  }

  private async doInstall(version: string): Promise<void> {
    // Ensure the install directory exists with a minimal package.json so
    // `npm install` has a place to write `node_modules`.
    mkdirSync(this.installDir, { recursive: true })
    const pkgJsonPath = join(this.installDir, 'package.json')
    if (!existsSync(pkgJsonPath)) {
      writeFileSync(
        pkgJsonPath,
        JSON.stringify({ name: 'clarify-cli-store', private: true, version: '0.0.0' }, null, 2),
      )
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Clarify: installing @clarify-labs/cli@${version}...`,
        cancellable: false,
      },
      () => this.runNpmInstall(version),
    )
  }

  private runNpmInstall(version: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn('npm', ['install', `${CLARIFY_NPM_PACKAGE}@${version}`], {
        cwd: this.installDir,
        shell: true,
        env: { ...process.env },
      })

      let stderr = ''
      proc.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString()
      })
      proc.on('error', (err) => {
        reject(new Error(`failed to spawn npm — ${err.message}`))
      })
      proc.on('exit', (code) => {
        if (code === 0) {
          resolve()
          return
        }
        reject(
          new Error(
            `npm install exited with code ${code}` +
              (stderr.trim() ? `\n${stderr.trim().split('\n').slice(-10).join('\n')}` : ''),
          ),
        )
      })
    })
  }
}
