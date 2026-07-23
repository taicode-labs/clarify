import { existsSync } from 'node:fs'

import * as vscode from 'vscode'

import { DependencyManager } from './dependencyManager'
import { resolveLocalClarifyBin } from './localCli'

const CLI_UPDATE_CHECKED_AT_KEY = 'clarify.cliUpdateCheckedAt'
const CLI_LATEST_VERSION_KEY = 'clarify.cliLatestVersion'
const CLI_DISMISSED_VERSION_KEY = 'clarify.cliDismissedVersion'
const CLI_UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000

type CliUpdateCheckerOptions = {
  isServerRunning: () => boolean
  onUpgradeStateChange: (upgrading: boolean) => void
}

export class CliUpdateChecker {
  constructor(private readonly context: vscode.ExtensionContext, private readonly dependencies: DependencyManager, private readonly options: CliUpdateCheckerOptions) {}

  async check(projectRoot: string): Promise<void> {
    const configuration = vscode.workspace.getConfiguration('clarify')
    if (configuration.get<string>('cliVersion', 'latest') !== 'latest') return

    const cliPath = configuration.get<string>('cliPath', '')
    if ((cliPath && existsSync(cliPath)) || resolveLocalClarifyBin(projectRoot)) return

    const installedVersion = this.dependencies.getInstalledVersion()
    if (!installedVersion) return

    const latestVersion = await this.getCachedLatestVersion()
    if (!latestVersion || latestVersion === installedVersion) return

    const dismissedVersion = this.context.globalState.get<string>(CLI_DISMISSED_VERSION_KEY)
    if (dismissedVersion === latestVersion) return

    const action = await vscode.window.showInformationMessage(
      `Clarify CLI ${latestVersion} is available (installed: ${installedVersion}).`,
      'Upgrade',
      'Later',
    )
    if (action !== 'Upgrade') {
      await this.context.globalState.update(CLI_DISMISSED_VERSION_KEY, latestVersion)
      return
    }

    this.options.onUpgradeStateChange(true)
    try {
      await this.dependencies.ensureInstalled(latestVersion)
      const restartNote = this.options.isServerRunning()
        ? ' It will be used the next time the preview server starts.'
        : ''
      vscode.window.showInformationMessage(
        `Clarify CLI upgraded from ${installedVersion} to ${latestVersion}.${restartNote}`,
      )
    } catch (error) {
      vscode.window.showErrorMessage(`Clarify: failed to upgrade CLI — ${formatError(error)}`)
    } finally {
      this.options.onUpgradeStateChange(false)
    }
  }

  private async getCachedLatestVersion(): Promise<string | undefined> {
    const now = Date.now()
    const checkedAt = this.context.globalState.get<number>(CLI_UPDATE_CHECKED_AT_KEY, 0)
    const cachedVersion = this.context.globalState.get<string>(CLI_LATEST_VERSION_KEY)

    if (cachedVersion && now - checkedAt < CLI_UPDATE_CHECK_INTERVAL_MS) {
      return cachedVersion
    }

    const latestVersion = await this.dependencies.getLatestVersion()
    await this.context.globalState.update(CLI_UPDATE_CHECKED_AT_KEY, now)
    if (latestVersion) {
      await this.context.globalState.update(CLI_LATEST_VERSION_KEY, latestVersion)
    }
    return latestVersion ?? cachedVersion
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
