import { beforeEach, describe, expect, it, vi } from 'vitest'

const { existsSync, resolveLocalClarifyBin, showErrorMessage, showInformationMessage } = vi.hoisted(
  () => ({
    existsSync: vi.fn(),
    resolveLocalClarifyBin: vi.fn(),
    showErrorMessage: vi.fn(),
    showInformationMessage: vi.fn(),
  }),
)

vi.mock('node:fs', () => ({ existsSync }))
vi.mock('../workspace/utils', () => ({ resolveLocalClarifyBin }))
vi.mock('vscode', () => ({
  window: { showErrorMessage, showInformationMessage },
  workspace: {
    getConfiguration: () => ({
      get: (key: string, fallback: unknown) => {
        if (key === 'cliVersion') return 'latest'
        if (key === 'cliPath') return ''
        return fallback
      },
    }),
  },
}))

import { CliUpdateChecker } from './updateChecker'

function createGlobalState(initial: Record<string, unknown> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    get: vi.fn((key: string, fallback?: unknown) => values.get(key) ?? fallback),
    update: vi.fn(async (key: string, value: unknown) => {
      values.set(key, value)
    }),
  }
}

function createDependencies() {
  return {
    getInstalledVersion: vi.fn(() => '1.0.0'),
    getLatestVersion: vi.fn(async () => '1.1.0'),
    ensureInstalled: vi.fn(async () => undefined),
  }
}

describe('CliUpdateChecker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    existsSync.mockReturnValue(false)
    resolveLocalClarifyBin.mockReturnValue(undefined)
  })

  it('uses a fresh cached version without querying npm', async () => {
    const globalState = createGlobalState({
      'clarify.cliUpdateCheckedAt': Date.now(),
      'clarify.cliLatestVersion': '1.1.0',
    })
    const dependencies = createDependencies()
    showInformationMessage.mockResolvedValue('Later')
    const checker = new CliUpdateChecker(
      { globalState } as never,
      dependencies as never,
      { isServerRunning: () => false, onUpgradeStateChange: vi.fn() },
    )

    await checker.check('/project')

    expect(dependencies.getLatestVersion).not.toHaveBeenCalled()
    expect(globalState.update).toHaveBeenCalledWith('clarify.cliDismissedVersion', '1.1.0')
  })

  it('does not prompt again for a dismissed version', async () => {
    const globalState = createGlobalState({
      'clarify.cliUpdateCheckedAt': Date.now(),
      'clarify.cliLatestVersion': '1.1.0',
      'clarify.cliDismissedVersion': '1.1.0',
    })
    const dependencies = createDependencies()
    const checker = new CliUpdateChecker(
      { globalState } as never,
      dependencies as never,
      { isServerRunning: () => false, onUpgradeStateChange: vi.fn() },
    )

    await checker.check('/project')

    expect(showInformationMessage).not.toHaveBeenCalled()
  })

  it('resets upgrade state after installation completes', async () => {
    const globalState = createGlobalState()
    const dependencies = createDependencies()
    const onUpgradeStateChange = vi.fn()
    showInformationMessage.mockResolvedValueOnce('Upgrade')
    const checker = new CliUpdateChecker(
      { globalState } as never,
      dependencies as never,
      { isServerRunning: () => true, onUpgradeStateChange },
    )

    await checker.check('/project')

    expect(dependencies.ensureInstalled).toHaveBeenCalledWith('1.1.0')
    expect(onUpgradeStateChange.mock.calls).toEqual([[true], [false]])
    expect(showErrorMessage).not.toHaveBeenCalled()
  })
})
