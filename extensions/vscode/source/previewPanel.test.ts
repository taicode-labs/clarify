import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createWebviewPanel } = vi.hoisted(() => ({
  createWebviewPanel: vi.fn(),
}))

vi.mock('vscode', () => ({
  ViewColumn: {
    Active: 1,
    Beside: 2,
  },
  window: {
    createWebviewPanel,
  },
}))

import { PreviewPanel } from './previewPanel'

function createPanel() {
  return {
    visible: true,
    viewColumn: 2,
    webview: { html: '' },
    onDidDispose: vi.fn(),
    reveal: vi.fn(),
    dispose: vi.fn(),
  }
}

describe('PreviewPanel', () => {
  beforeEach(() => {
    createWebviewPanel.mockReset()
  })

  it('does not recreate a closed panel during automatic navigation', () => {
    const preview = new PreviewPanel({} as never)

    preview.show('http://localhost:5173/guide', true, false)

    expect(createWebviewPanel).not.toHaveBeenCalled()
  })

  it('creates a panel when the user explicitly opens the preview', () => {
    createWebviewPanel.mockReturnValue(createPanel())
    const preview = new PreviewPanel({} as never)

    preview.show('http://localhost:5173/guide', true, true)

    expect(createWebviewPanel).toHaveBeenCalledOnce()
  })
})
