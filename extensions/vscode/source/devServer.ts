import { ChildProcess, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import * as vscode from 'vscode'

const SERVER_URL_REGEX = /https?:\/\/localhost:\d+/
const SERVER_READY_TIMEOUT_MS = 30_000
const CLARIFY_NPM_PACKAGE = '@clarify-labs/cli'

/**
 * Manages the lifecycle of a `clarify dev` subprocess.
 *
 * Version resolution:
 *  1. If the project has a local `@clarify-labs/cli` install, use its bin
 *     (local install always wins to avoid version drift).
 *  2. Otherwise fall back to `npx @clarify-labs/cli@<version>` using the
 *     `clarify.version` setting (default "latest").
 */
export class DevServerManager {
  private process?: ChildProcess
  private serverUrl?: string
  private disposables: vscode.Disposable[] = []

  constructor(private readonly context: vscode.ExtensionContext) {}

  isRunning(): boolean {
    return this.process !== undefined && !this.process.killed
  }

  getServerUrl(): string | undefined {
    return this.serverUrl
  }

  async start(workspaceRoot: string): Promise<string> {
    if (this.isRunning()) {
      return this.serverUrl!
    }

    const config = vscode.workspace.getConfiguration('clarify')
    const port = config.get<number>('port', 5173)
    const version = config.get<string>('version', 'latest')

    const bin = this.resolveClarifyBin(workspaceRoot, version)
    const args = ['dev', '--port', String(port), '--no-open']

    this.serverUrl = undefined

    this.process = spawn(bin, args, {
      cwd: workspaceRoot,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '0' },
    })

    this.process.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      process.stdout.write(text)
      if (!this.serverUrl) {
        const match = text.match(SERVER_URL_REGEX)
        if (match) this.serverUrl = match[0]
      }
    })

    this.process.stderr?.on('data', (chunk: Buffer) => {
      process.stderr.write(chunk)
    })

    this.process.on('exit', (code) => {
      this.process = undefined
      this.serverUrl = undefined
      if (code !== null && code !== 0) {
        vscode.window.showErrorMessage(`Clarify dev server exited with code ${code}.`)
      }
    })

    return this.waitForServerUrl()
  }

  async stop(): Promise<void> {
    if (!this.process) return
    const proc = this.process
    this.process = undefined
    this.serverUrl = undefined

    return new Promise((resolve) => {
      proc.once('exit', () => resolve())
      if (!proc.kill('SIGTERM')) {
        proc.kill('SIGKILL')
      }
      // Don't hang forever if the process refuses to exit.
      setTimeout(() => {
        resolve()
      }, 3000)
    })
  }

  dispose(): void {
    void this.stop()
    for (const d of this.disposables) d.dispose()
    this.disposables = []
  }

  /**
   * Resolve the `clarify` binary to spawn.
   *
   * 1. Local install: `<workspaceRoot>/node_modules/.bin/clarify` — always wins
   *    so the user's pinned version is used.
   * 2. `npx @clarify-labs/cli@<version>` — uses the `clarify.version` setting.
   *    Falls back to `@clarify-labs/cli@latest` if the configured version fails.
   */
  private resolveClarifyBin(workspaceRoot: string, version: string): string {
    const localBin = join(workspaceRoot, 'node_modules', '.bin', 'clarify')
    if (existsSync(localBin)) {
      return localBin
    }
    return `npx ${CLARIFY_NPM_PACKAGE}@${version}`
  }

  private waitForServerUrl(): Promise<string> {
    return new Promise((resolve, reject) => {
      const start = Date.now()
      const check = () => {
        if (this.serverUrl) {
          resolve(this.serverUrl)
          return
        }
        if (!this.process) {
          reject(new Error('dev server process exited before becoming ready'))
          return
        }
        if (Date.now() - start > SERVER_READY_TIMEOUT_MS) {
          reject(new Error(`timed out waiting for dev server to start (is ${CLARIFY_NPM_PACKAGE} installed?)`))
          return
        }
        setTimeout(check, 200)
      }
      check()
    })
  }
}
