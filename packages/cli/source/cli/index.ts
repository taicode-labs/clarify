#!/usr/bin/env node
import { cac } from 'cac'

import { runBuild } from './commands/build.js'
import { runCheck, type CheckCommandOptions } from './commands/check.js'
import { runDev } from './commands/dev.js'
import { runInit } from './commands/init.js'
import { resolveCliOptions, type CliOptions, type ResolvedCliOptions } from './options.js'
import { cliPackageVersion } from './package.js'

type InitCommandOptions = CliOptions & {
  force?: boolean
  template?: string
  install?: boolean
}

function withSharedOptions(command: ReturnType<ReturnType<typeof cac>['command']>) {
  return command
    .option('--root <dir>', 'Project root directory')
    .option('--content <dir>', 'Content directory relative to root')
    .option('--output <dir>', 'Build output directory relative to root')
}

function resolveOptions(options: CliOptions): ResolvedCliOptions {
  return resolveCliOptions(options)
}

async function main(): Promise<void> {
  const cli = cac('clarify')

  cli
    .version(cliPackageVersion)
    .help()

  withSharedOptions(cli.command('dev', 'Start the local documentation server'))
    .option('--host [host]', 'Dev server host')
    .option('--port <port>', 'Dev server port')
    .option('--open [path]', 'Open the dev server in a browser')
    .action(async (options: CliOptions) => {
      await runDev(resolveOptions(options))
    })

  withSharedOptions(cli.command('build', 'Build the static documentation site'))
    .action(async (options: CliOptions) => {
      await runBuild(resolveOptions(options))
    })

  withSharedOptions(cli.command('check', 'Validate the documentation project'))
    .option('--strict', 'Treat warnings as failures')
    .option('--format <format>', 'Output format: text or json')
    .action(async (options: CheckCommandOptions) => {
      await runCheck(options)
    })

  withSharedOptions(cli.command('init', 'Create a Clarify project scaffold'))
    .option('--force', 'Overwrite files created by init')
    .option('--template <name>', 'Template to use: minimal, standard, or complete')
    .option('--install', 'Install dependencies after init')
    .action((options: InitCommandOptions) => {
      runInit(resolveOptions(options), options.force === true, options.template, options.install === true)
    })

  const args = process.argv.slice(2)
  cli.parse(process.argv, { run: false })

  if (args.length === 0) {
    cli.outputHelp()
    return
  }

  await cli.runMatchedCommand()
}

main().catch(error => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error))
  process.exitCode = 1
})
