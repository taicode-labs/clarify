/**
 * Host-side process management for the Clarify dev server.
 *
 * This module is responsible for starting `clarify dev` in the workspace,
 * waiting until the dev server is reachable, and stopping it cleanly.
 */
import { ChildProcess, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createServer } from 'node:net'

import * as vscode from 'vscode'

import { DependencyManager } from './dependencyManager'
import { resolveLocalClarifyBin } from './utils'

// Give Vite up to 120 seconds to compile and start on first run
const SERVER_READY_TIMEOUT_MS = 120_000
const SERVER_READY_CHECK_INTERVAL_MS = 300

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
  private workspaceRoot?: string
  /** Shared promise for any in-progress start. Callers await this directly. */
  private starting?: Promise<string>
  private startingRoot?: string
  private generation = 0

  constructor(private readonly dependencies: DependencyManager) {}

  isRunning(): boolean {
    return this.process !== undefined && !this.process.killed
  }

  getServerUrl(): string | undefined {
    return this.serverUrl
  }

  getWorkspaceRoot(): string | undefined {
    return this.workspaceRoot ?? this.startingRoot
  }

  /**
   * Start the dev server and resolve once it is accepting HTTP requests.
   * If a start is already in progress, all callers share the same Promise.
   * If the server is already running and ready, resolves immediately.
   */
  async start(workspaceRoot: string): Promise<string> {
    // Already running and healthy — return immediately
    if (
      !this.starting &&
      this.workspaceRoot === workspaceRoot &&
      this.isRunning() &&
      this.serverUrl
    ) {
      return Promise.resolve(this.serverUrl)
    }

    // A start is already in progress — share it
    if (this.starting) {
      if (this.startingRoot === workspaceRoot) return this.starting
      await this.starting.catch(() => {})
    }

    if (this.process) await this.stop()

    // Kick off a new start and store the shared promise
    const generation = ++this.generation
    this.startingRoot = workspaceRoot
    this.starting = this.doStart(workspaceRoot, generation).finally(() => {
      if (this.startingRoot === workspaceRoot && this.generation === generation) {
        this.starting = undefined
        this.startingRoot = undefined
      }
    })

    return this.starting
  }

  private async doStart(workspaceRoot: string, generation: number): Promise<string> {
    const bin = await this.resolveClarifyBin(workspaceRoot)
    this.assertCurrent(generation)
    console.log(`[clarify] Starting: ${bin} dev in ${workspaceRoot}`)

    const port = await getFreePort()
    this.assertCurrent(generation)
    const url = `http://localhost:${port}`
    const child = spawn(bin, ['dev', '--port', String(port), '--no-open'], {
      cwd: workspaceRoot,
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    })
    this.process = child
    this.workspaceRoot = workspaceRoot

    child.stdout?.on('data', (chunk: Buffer) => process.stdout.write(chunk))
    child.stderr?.on('data', (chunk: Buffer) => process.stderr.write(chunk))
    child.on('exit', (code) => {
      console.log(`[clarify] Process exited with code ${code}`)
      if (this.process === child) {
        this.process = undefined
        this.serverUrl = undefined
        this.workspaceRoot = undefined
      }
      if (code !== null && code !== 0) {
        vscode.window.showErrorMessage(`Clarify dev server exited with code ${code}.`)
      }
    })

    try {
      await this.pollUntilReady(url, child, generation)
      console.log(`[clarify] Server ready at ${url}`)
      return url
    } catch (error) {
      await this.stopProcess(child)
      if (this.process === child) {
        this.process = undefined
        this.serverUrl = undefined
        this.workspaceRoot = undefined
      }
      throw error
    }
  }

  private assertCurrent(generation: number): void {
    if (this.generation !== generation) {
      throw new Error('Dev server start was superseded by a newer request')
    }
  }

  /**
   * Poll the dev server until any valid HTTP response is received.
   *
   * The dev server may return 404 before the preview route exists, so we
   * treat any response as readiness if the process is still alive.
   */
  private pollUntilReady(url: string, child: ChildProcess, generation: number): Promise<void> {
    const deadline = Date.now() + SERVER_READY_TIMEOUT_MS

    return new Promise((resolve, reject) => {
      const attempt = async () => {
        if (this.generation !== generation || this.process !== child || child.exitCode !== null) {
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

  /**
   * Stop the currently running dev server process.
   *
   * The server is asked to terminate gracefully, and a forced kill is used
   * if it does not exit within a short timeout.
   */
  async stop(): Promise<void> {
    this.generation += 1
    this.starting = undefined
    this.startingRoot = undefined
    if (!this.process) {
      this.serverUrl = undefined
      this.workspaceRoot = undefined
      return
    }
    const proc = this.process
    this.process = undefined
    this.serverUrl = undefined
    this.workspaceRoot = undefined
    // pollUntilReady checks this.process and will reject the in-flight start naturally

    return this.stopProcess(proc)
  }

  private stopProcess(proc: ChildProcess): Promise<void> {
    return new Promise((resolve) => {
      proc.once('exit', () => resolve())
      if (!proc.kill('SIGTERM')) proc.kill('SIGKILL')
      setTimeout(resolve, 3000)
    })
  }

  /**
   * Resolve the `clarify` binary path to use for starting the dev server.
   *
   * Resolution order:
   *   1. `clarify.cliPath` configuration (explicit path, useful for dev mode)
   *   2. Workspace-local install (`node_modules/.bin/clarify`)
   *   3. Extension-managed install in VS Code global storage
   */
  private async resolveClarifyBin(workspaceRoot: string): Promise<string> {
    // 1. Explicit cliPath configuration
    const cliPath = vscode.workspace.getConfiguration('clarify').get<string>('cliPath', '')
    if (cliPath && existsSync(cliPath)) {
      console.log(`[clarify] Using explicit cliPath: ${cliPath}`)
      return cliPath
    }

    // 2. Workspace-local install
    const localBin = resolveLocalClarifyBin(workspaceRoot)
    if (localBin) {
      console.log(`[clarify] Using local CLI: ${localBin}`)
      return localBin
    }

    // 3. Extension-managed install
    const version = vscode.workspace.getConfiguration('clarify').get<string>('cliVersion', 'latest')
    await this.dependencies.ensureInstalled(version)
    console.log(`[clarify] Using extension-managed CLI: ${this.dependencies.binPath}`)
    return this.dependencies.binPath
  }
}
