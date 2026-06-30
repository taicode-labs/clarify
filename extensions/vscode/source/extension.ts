import * as vscode from 'vscode'

import { DevServerManager } from './devServer'
import { PreviewPanel } from './previewPanel'
import { RouteResolver } from './routeResolver'
import { isContentFile } from './utils'

let devServer: DevServerManager
let routeResolver: RouteResolver | undefined
let previewPanel: PreviewPanel
let autoOpenDisposable: vscode.Disposable | undefined

export function activate(context: vscode.ExtensionContext): void {
  devServer = new DevServerManager(context)
  previewPanel = new PreviewPanel(context)

  const startCmd = vscode.commands.registerCommand('clarify.startPreview', async () => {
    await ensureDevServerStarted(context)
  })

  const stopCmd = vscode.commands.registerCommand('clarify.stopPreview', async () => {
    autoOpenDisposable?.dispose()
    autoOpenDisposable = undefined
    await devServer.stop()
    previewPanel.dispose()
    routeResolver = undefined
    vscode.window.showInformationMessage('Clarify dev server stopped.')
  })

  const openCmd = vscode.commands.registerCommand('clarify.openPreview', async () => {
    const active = vscode.window.activeTextEditor
    if (!active || !isContentFile(active.document.uri.fsPath)) {
      vscode.window.showInformationMessage('Clarify: open a content file (.md/.mdx) to preview.')
      return
    }

    const started = await ensureDevServerStarted(context)
    if (!started) return

    await navigateToRoute(active.document.uri.fsPath)
  })

  const refreshCmd = vscode.commands.registerCommand('clarify.refreshPreview', () => {
    previewPanel.reload()
  })

  context.subscriptions.push(startCmd, stopCmd, openCmd, refreshCmd)
}

export function deactivate(): Promise<void> {
  return devServer?.stop() ?? Promise.resolve()
}

function pickWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
  const folders = vscode.workspace.workspaceFolders
  if (!folders || folders.length === 0) return undefined
  if (folders.length === 1) return folders[0]
  return vscode.workspace.workspaceFolders?.[0]
}

async function ensureDevServerStarted(context: vscode.ExtensionContext): Promise<boolean> {
  if (devServer.isRunning() && routeResolver) return true

  const folder = pickWorkspaceFolder()
  if (!folder) {
    vscode.window.showWarningMessage('Clarify: Open a workspace folder first.')
    return false
  }

  try {
    const serverUrl = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Clarify: starting dev server...',
        cancellable: false,
      },
      () => devServer.start(folder.uri.fsPath),
    )
    routeResolver = new RouteResolver(serverUrl)
    vscode.window.showInformationMessage(`Clarify dev server running at ${serverUrl}`)
    registerAutoOpen(context)
    return true
  } catch (err) {
    vscode.window.showErrorMessage(`Clarify: failed to start dev server — ${formatError(err)}`)
    return false
  }
}

function registerAutoOpen(context: vscode.ExtensionContext): void {
  autoOpenDisposable?.dispose()
  const config = vscode.workspace.getConfiguration('clarify')
  if (!config.get<boolean>('autoOpenPreview', true)) return

  autoOpenDisposable = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
    if (!editor) return
    const filePath = editor.document.uri.fsPath
    if (!isContentFile(filePath)) return
    await navigateToRoute(filePath)
  })
  context.subscriptions.push(autoOpenDisposable)
}

async function navigateToRoute(filePath: string): Promise<void> {
  if (!routeResolver) return
  try {
    const previewUrl = await routeResolver.resolveRoute(filePath)
    if (previewUrl) {
      const openToSide = vscode.workspace.getConfiguration('clarify').get<boolean>('openToSide', true)
      previewPanel.show(previewUrl, openToSide)
    }
  } catch (err) {
    vscode.window.showErrorMessage(`Clarify: could not resolve route — ${formatError(err)}`)
  }
}

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}
