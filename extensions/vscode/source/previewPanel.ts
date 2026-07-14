import * as vscode from 'vscode'

/**
 * Wraps a WebviewPanel that renders the Clarify dev server inside an iframe.
 *
 * The iframe is a full browser context, so Vite's HMR WebSocket works
 * out-of-the-box — edits to content files are reflected live without any
 * extension-side polling.
 */
export class PreviewPanel {
  private panel?: vscode.WebviewPanel
  private currentUrl?: string

  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * Show or reveal the preview panel and load the specified preview URL.
   */
  show(previewUrl: string, openToSide: boolean, createIfMissing = true, preserveFocus = false): void {
    if (!this.panel) {
      if (!createIfMissing) return

      this.panel = vscode.window.createWebviewPanel(
        'clarifyPreview',
        'Clarify Preview',
        openToSide ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active,
        {
          enableScripts: true,
          enableForms: true,
          retainContextWhenHidden: true,
        },
      )
      this.panel.onDidDispose(() => {
        this.panel = undefined
        this.currentUrl = undefined
      })
    } else if (!this.panel.visible) {
      this.panel.reveal(
        openToSide ? vscode.ViewColumn.Beside : this.panel.viewColumn,
        preserveFocus,
      )
    }

    this.currentUrl = previewUrl
    this.panel.webview.html = this.renderHtml(previewUrl)
  }

  reload(): void {
    if (!this.panel || !this.currentUrl) return
    // Re-setting the HTML forces the iframe to reload.
    this.panel.webview.html = this.renderHtml(this.currentUrl)
  }

  dispose(): void {
    this.panel?.dispose()
    this.panel = undefined
    this.currentUrl = undefined
  }

  private renderHtml(previewUrl: string): string {
    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src http: https:; script-src 'none'; style-src 'unsafe-inline';" />
  <style>
    html, body { margin: 0; padding: 0; height: 100vh; overflow: hidden; }
    iframe { width: 100%; height: 100%; border: 0; display: block; }
  </style>
</head>
<body>
  <iframe src="${previewUrl}" title="Clarify Preview"></iframe>
</body>
</html>`
  }
}
