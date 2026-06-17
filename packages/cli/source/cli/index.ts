#!/usr/bin/env node
import { cac } from 'cac'
import { build as viteBuild, createServer } from 'vite'

import { runInit } from './init.js'
import { resolveCliOptions, type CliOptions, type ResolvedCliOptions } from './options.js'
import { readPackageVersion } from './package.js'
import { createViteConfig } from './vite.js'

async function runDev(options: ResolvedCliOptions): Promise<void> {
  const server = await createServer(createViteConfig(options))
  await server.listen()
  server.printUrls()
  server.bindCLIShortcuts({ print: true })
}

async function runBuild(options: ResolvedCliOptions): Promise<void> {
  await viteBuild(createViteConfig(options))
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
    .version(readPackageVersion())
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

  withSharedOptions(cli.command('init', 'Create a minimal Clarify project scaffold'))
    .option('--force', 'Overwrite files created by init')
    .action((options: CliOptions & { force?: boolean }) => {
      runInit(resolveOptions(options), options.force === true)
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
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
