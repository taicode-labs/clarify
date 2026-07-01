import * as vscode from 'vscode'

import { DevServerManager } from './devServer'
import { PreviewPanel } from './previewPanel'
import { RouteResolver } from './routeResolver'
import { resolveClarifyContentFile } from './utils'

let devServer: DevServerManager
let routeResolver: RouteResolver | undefined
let previewPanel: PreviewPanel
let autoOpenDisposable: vscode.Disposable | undefined
let activeEditorDisposable: vscode.Disposable | undefined

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
    if (!active) {
      vscode.window.showInformationMessage('Clarify: open a content file (.md/.mdx) to preview.')
      return
    }

    const info = resolveClarifyContentFile(active.document.uri.fsPath)
    if (!info) {
      vscode.window.showInformationMessage(
        'Clarify: this file is not inside a Clarify project content root.',
      )
      return
    }

    const started = await ensureDevServerStarted(context, info.projectRoot)
    if (!started) return

    await navigateToRoute(active.document.uri.fsPath)
  })

  const refreshCmd = vscode.commands.registerCommand('clarify.refreshPreview', () => {
    previewPanel.reload()
  })

  context.subscriptions.push(startCmd, stopCmd, openCmd, refreshCmd)

  // Dynamically show/hide the preview button based on whether the active file
  // is a Clarify content file. The `clarify.inProject` context key is consumed
  // by the `editor/title` menu `when` clause in package.json.
  updateContentFileContext(vscode.window.activeTextEditor)
  activeEditorDisposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
    updateContentFileContext(editor)
  })
  context.subscriptions.push(activeEditorDisposable)
}

export function deactivate(): Promise<void> {
  return devServer?.stop() ?? Promise.resolve()
}

function updateContentFileContext(editor: vscode.TextEditor | undefined): void {
  const inProject = !!editor && !!resolveClarifyContentFile(editor.document.uri.fsPath)
  void vscode.commands.executeCommand('setContext', 'clarify.inProject', inProject)
}

async function ensureDevServerStarted(
  context: vscode.ExtensionContext,
  projectRoot?: string,
): Promise<boolean> {
  if (devServer.isRunning() && routeResolver) return true

  const root = projectRoot ?? resolveProjectRootFromActiveEditor()
  if (!root) {
    vscode.window.showWarningMessage(
      'Clarify: open a content file inside a Clarify project first.',
    )
    return false
  }

  try {
    const serverUrl = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Clarify: starting dev server...',
        cancellable: false,
      },
      () => devServer.start(root),
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

function resolveProjectRootFromActiveEditor(): string | undefined {
  const active = vscode.window.activeTextEditor
  if (!active) return undefined
  return resolveClarifyContentFile(active.document.uri.fsPath)?.projectRoot
}

function registerAutoOpen(context: vscode.ExtensionContext): void {
  autoOpenDisposable?.dispose()
  const config = vscode.workspace.getConfiguration('clarify')
  if (!config.get<boolean>('autoOpenPreview', true)) return

  autoOpenDisposable = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
    if (!editor) return
    const filePath = editor.document.uri.fsPath
    if (!resolveClarifyContentFile(filePath)) return
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
