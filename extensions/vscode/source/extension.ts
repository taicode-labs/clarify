import * as vscode from 'vscode'

import { DependencyManager } from './dependencyManager'
import { DevServerManager } from './devServer'
import { PreviewPanel } from './previewPanel'
import { fetchProjectInfo } from './projectInfo'
import { RouteResolver } from './routeResolver'
import {
  BOOTSTRAP_CONVENTIONS,
  conventionsFromProjectInfo,
  findClarifyProjectRoot,
  resolveClarifyContentFile,
  resolveLocalClarifyBin,
  type ProjectConventions,
} from './utils'

let devServer: DevServerManager
let deps: DependencyManager
let routeResolver: RouteResolver | undefined
let previewPanel: PreviewPanel
let autoOpenDisposable: vscode.Disposable | undefined
let statusBar: vscode.StatusBarItem
let isInstallingCli = false
let extensionContext: vscode.ExtensionContext

let conventions: ProjectConventions = BOOTSTRAP_CONVENTIONS

export function activate(context: vscode.ExtensionContext): void {
  extensionContext = context
  deps = new DependencyManager(context)
  devServer = new DevServerManager(deps)
  previewPanel = new PreviewPanel(context)

  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  statusBar.command = 'clarify.openPreview'
  context.subscriptions.push(statusBar)

  void ensureCliInstalled()
  updateStatusBar()

  // Auto-start the dev server silently in the background
  const autoStart = vscode.workspace.getConfiguration('clarify').get<boolean>('autoStartServer', true)
  if (autoStart) {
    void backgroundStart()
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('clarify.openPreview', async () => {
      const active = vscode.window.activeTextEditor
      if (!active) {
        vscode.window.showInformationMessage('Clarify: open a content file (.md/.mdx) to preview.')
        return
      }
      const info = resolveClarifyContentFile(active.document.uri.fsPath, conventions)
      if (!info) {
        vscode.window.showInformationMessage(
          'Clarify: this file is not inside a Clarify project content root.',
        )
        return
      }
      await openPreview(info.projectRoot, active.document.uri.fsPath)
    }),

    vscode.commands.registerCommand('clarify.stopPreview', async () => {
      autoOpenDisposable?.dispose()
      autoOpenDisposable = undefined
      routeResolver = undefined
      await devServer.stop()
      previewPanel.dispose()
      updateStatusBar()
      vscode.window.showInformationMessage('Clarify dev server stopped.')
    }),

    vscode.commands.registerCommand('clarify.refreshPreview', () => {
      previewPanel.reload()
    }),

    vscode.window.onDidChangeActiveTextEditor((editor) => {
      updateContentFileContext(editor)
      updateStatusBar()
    }),

    vscode.workspace.onDidChangeWorkspaceFolders(() => updateStatusBar()),
  )

  updateContentFileContext(vscode.window.activeTextEditor)
}

export function deactivate(): Promise<void> {
  return devServer?.stop() ?? Promise.resolve()
}

// ---------------------------------------------------------------------------
// Core flow: start server → create resolver → navigate
// ---------------------------------------------------------------------------

/**
 * The single entry point for "open preview".
 * Starts the server (with progress UI), sets up the resolver, navigates.
 */
async function openPreview(projectRoot: string, filePath: string): Promise<void> {
  try {
    await ensureServerReady(projectRoot, true)
    setupAutoOpen()
    updateStatusBar()
    await navigateToRoute(filePath)
  } catch (err) {
    vscode.window.showErrorMessage(`Clarify: failed to start dev server — ${formatError(err)}`)
    updateStatusBar()
  }
}

/**
 * Silently start the dev server when the extension activates.
 * Errors are suppressed — the user can always click the preview button to retry.
 */
async function backgroundStart(): Promise<void> {
  try {
    const root = detectProjectRoot()
    if (!root) return

    console.log('[clarify] Background starting dev server...')
    await ensureServerReady(root, false)
    setupAutoOpen()
    console.log('[clarify] Background start complete')
  } catch (err) {
    console.error('[clarify] Background start failed:', err)
  }
}

/**
 * Ensure the dev server is running and `routeResolver` is ready.
 * Because `DevServerManager.start()` returns a shared promise when a start is
 * already in progress, background start and manual clicks never race.
 */
async function ensureServerReady(projectRoot: string, withProgress: boolean): Promise<string> {
  // Already fully ready
  if (devServer.isRunning() && routeResolver) {
    return devServer.getServerUrl()!
  }

  await ensureCliAvailable()

  const doStart = (): Promise<string> => devServer.start(projectRoot)
  const serverUrl = withProgress
    ? await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Clarify: starting dev server…',
          cancellable: false,
        },
        doStart,
      )
    : await doStart()

  // Create resolver (background start may race here but both will assign the same URL)
  routeResolver = new RouteResolver(serverUrl)
  const info = await fetchProjectInfo(serverUrl)
  if (info) {
    conventions = conventionsFromProjectInfo(info)
    updateContentFileContext(vscode.window.activeTextEditor)
  }

  return serverUrl
}

/**
 * Resolve a file to its preview URL and show the webview panel.
 */
async function navigateToRoute(filePath: string): Promise<void> {
  if (!routeResolver) return

  try {
    const previewUrl = await routeResolver.resolveRoute(filePath)
    if (!previewUrl) {
      vscode.window.showWarningMessage('Clarify: could not resolve a preview route for this file.')
      return
    }
    const openToSide = vscode.workspace.getConfiguration('clarify').get<boolean>('openToSide', true)
    previewPanel.show(previewUrl, openToSide)
  } catch (err) {
    vscode.window.showErrorMessage(`Clarify: could not resolve route — ${formatError(err)}`)
  }
}

// ---------------------------------------------------------------------------
// Auto-open on editor switch
// ---------------------------------------------------------------------------

function setupAutoOpen(): void {
  autoOpenDisposable?.dispose()
  if (!vscode.workspace.getConfiguration('clarify').get<boolean>('autoOpenPreview', true)) return

  autoOpenDisposable = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
    if (!editor || !routeResolver || !devServer.isRunning()) return
    const filePath = editor.document.uri.fsPath
    if (!resolveClarifyContentFile(filePath, conventions)) return
    await navigateToRoute(filePath)
  })
  extensionContext.subscriptions.push(autoOpenDisposable)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function updateContentFileContext(editor: vscode.TextEditor | undefined): void {
  const inProject = !!editor && !!resolveClarifyContentFile(editor.document.uri.fsPath, conventions)
  void vscode.commands.executeCommand('setContext', 'clarify.inProject', inProject)
}

function detectProjectRoot(): string | undefined {
  const active = vscode.window.activeTextEditor
  if (active) {
    const info = resolveClarifyContentFile(active.document.uri.fsPath, conventions)
    if (info) return info.projectRoot
  }
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    const root = findClarifyProjectRoot(folder.uri.fsPath, conventions)
    if (root) return root
  }
  return undefined
}

function updateStatusBar(): void {
  if (isInstallingCli) {
    statusBar.text = '$(loading~spin) Clarify: Installing CLI…'
    statusBar.tooltip = 'Installing Clarify CLI'
    statusBar.show()
    return
  }

  if (devServer.isRunning()) {
    statusBar.text = '$(vm-active) Clarify'
    statusBar.tooltip = `Dev server running at ${devServer.getServerUrl() ?? 'unknown'}\nClick to open preview`
    statusBar.show()
    return
  }

  if (!detectProjectRoot()) {
    statusBar.hide()
    return
  }

  const version = vscode.workspace.getConfiguration('clarify').get<string>('version', 'latest')
  const hasCli = workspaceHasLocalClarifyCli() || deps.isVersionInstalled(version)
  statusBar.text = hasCli ? '$(circle-outline) Clarify' : '$(warning) Clarify'
  statusBar.tooltip = hasCli
    ? 'Clarify project detected — click to open preview'
    : 'Clarify project detected — CLI not installed, click to install and preview'
  statusBar.show()
}

async function ensureCliInstalled(): Promise<void> {
  if (workspaceHasLocalClarifyCli()) return
  const version = vscode.workspace.getConfiguration('clarify').get<string>('version', 'latest')
  if (deps.isVersionInstalled(version)) return

  isInstallingCli = true
  updateStatusBar()
  try {
    await deps.ensureInstalled(version)
  } catch (err) {
    vscode.window.showErrorMessage(`Clarify: failed to install CLI — ${formatError(err)}`)
  } finally {
    isInstallingCli = false
    updateStatusBar()
  }
}

async function ensureCliAvailable(): Promise<void> {
  if (isInstallingCli) {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Clarify: waiting for CLI install…',
        cancellable: false,
      },
      async () => {
        while (isInstallingCli) {
          await new Promise<void>((r) => setTimeout(r, 100))
        }
      },
    )
  }
  if (workspaceHasLocalClarifyCli()) return
  const version = vscode.workspace.getConfiguration('clarify').get<string>('version', 'latest')
  if (deps.isVersionInstalled(version)) return

  isInstallingCli = true
  updateStatusBar()
  try {
    await deps.ensureInstalled(version)
  } finally {
    isInstallingCli = false
    updateStatusBar()
  }
}

function workspaceHasLocalClarifyCli(): boolean {
  if (vscode.workspace.getConfiguration('clarify').get<string>('cliPath', '')) return true
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    if (resolveLocalClarifyBin(folder.uri.fsPath)) return true
  }
  return false
}

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}
