import { ChildProcess, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createServer } from 'node:net'

import * as vscode from 'vscode'

import { DependencyManager } from './dependencyManager'
import { resolveLocalClarifyBin } from './utils'

// Give Vite up to 120 seconds to compile and start on first run
const SERVER_READY_TIMEOUT_MS = 120_000
const SERVER_READY_CHECK_INTERVAL_MS = 300
const CLARIFY_NPM_PACKAGE = '@clarify-labs/cli'

/** Ask the OS to assign a free port by binding to :0, then release it. */
function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer()
    srv.listen(0, () => {
      const addr = srv.address()
      const port = typeof addr === 'object' && addr ? addr.port : 0
      srv.close((err) => (err ? reject(err) : resolve(port)))
    })
    srv.on('error', reject)
  })
}

/**
 * Manages the lifecycle of a `clarify dev` subprocess.
 */
export class DevServerManager {
  private process?: ChildProcess
  private serverUrl?: string
  /** Shared promise for any in-progress start. Callers await this directly. */
  private starting?: Promise<string>

  constructor(private readonly deps: DependencyManager) {}

  isRunning(): boolean {
    return this.process !== undefined && !this.process.killed
  }

  getServerUrl(): string | undefined {
    return this.serverUrl
  }

  /**
   * Start the dev server and resolve once it is accepting HTTP requests.
   * If a start is already in progress, all callers share the same Promise.
   * If the server is already running and ready, resolves immediately.
   */
  start(workspaceRoot: string): Promise<string> {
    // Already running and healthy — return immediately
    if (!this.starting && this.isRunning() && this.serverUrl) {
      return Promise.resolve(this.serverUrl)
    }

    // A start is already in progress — share it
    if (this.starting) {
      return this.starting
    }

    // Kick off a new start and store the shared promise
    this.starting = this.doStart(workspaceRoot).finally(() => {
      this.starting = undefined
    })

    return this.starting
  }

  private async doStart(workspaceRoot: string): Promise<string> {
    const config = vscode.workspace.getConfiguration('clarify')
    const version = config.get<string>('version', 'latest')

    const bin = await this.resolveClarifyBin(workspaceRoot, version)
    console.log(`[clarify] Starting: ${bin} dev in ${workspaceRoot}`)

    const port = await getFreePort()
    const url = `http://localhost:${port}`
    this.serverUrl = url

    this.process = spawn(bin, ['dev', '--port', String(port), '--no-open'], {
      cwd: workspaceRoot,
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    })

    this.process.stdout?.on('data', (chunk: Buffer) => process.stdout.write(chunk))
    this.process.stderr?.on('data', (chunk: Buffer) => process.stderr.write(chunk))
    this.process.on('exit', (code) => {
      console.log(`[clarify] Process exited with code ${code}`)
      this.process = undefined
      this.serverUrl = undefined
      if (code !== null && code !== 0) {
        vscode.window.showErrorMessage(`Clarify dev server exited with code ${code}.`)
      }
    })

    await this.pollUntilReady(url)
    console.log(`[clarify] Server ready at ${url}`)
    return url
  }

  /** Poll HTTP HEAD until the server responds OK or timeout is reached. */
  private pollUntilReady(url: string): Promise<void> {
    const deadline = Date.now() + SERVER_READY_TIMEOUT_MS

    return new Promise((resolve, reject) => {
      const attempt = async () => {
        if (!this.process) {
          reject(new Error('Dev server process exited before becoming ready'))
          return
        }
        if (Date.now() > deadline) {
          reject(new Error(`Timed out waiting for dev server at ${url}`))
          return
        }
        try {
          const res = await fetch(url, { method: 'HEAD' })
          if (res.ok || res.status === 404) {
            // 404 is still a valid HTTP response — server is up
            resolve()
            return
          }
        } catch {
          // ECONNREFUSED — server not up yet, retry
        }
        setTimeout(attempt, SERVER_READY_CHECK_INTERVAL_MS)
      }
      attempt()
    })
  }

  async stop(): Promise<void> {
    if (!this.process) return
    const proc = this.process
    this.process = undefined
    this.serverUrl = undefined
    // pollUntilReady checks this.process and will reject the in-flight start naturally

    return new Promise((resolve) => {
      proc.once('exit', () => resolve())
      if (!proc.kill('SIGTERM')) proc.kill('SIGKILL')
      setTimeout(resolve, 3000)
    })
  }

  private async resolveClarifyBin(workspaceRoot: string, version: string): Promise<string> {
    const cliPath = vscode.workspace.getConfiguration('clarify').get<string>('cliPath', '')
    if (cliPath && existsSync(cliPath)) {
      console.log(`[clarify] Using explicit cliPath: ${cliPath}`)
      return cliPath
    }

    const localBin = resolveLocalClarifyBin(workspaceRoot)
    if (localBin) {
      console.log(`[clarify] Using local CLI: ${localBin}`)
      return localBin
    }

    try {
      await this.deps.ensureInstalled(version)
      if (existsSync(this.deps.binPath)) {
        console.log(`[clarify] Using managed install: ${this.deps.binPath}`)
        return this.deps.binPath
      }
    } catch (err) {
      vscode.window.showWarningMessage(
        `Clarify: could not install @clarify-labs/cli@${version} — falling back to npx. (${formatError(err)})`,
      )
    }

    console.log(`[clarify] Falling back to npx`)
    return `npx ${CLARIFY_NPM_PACKAGE}@${version}`
  }
}

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}
