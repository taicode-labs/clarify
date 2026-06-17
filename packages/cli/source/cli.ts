#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { build as viteBuild, createServer, type InlineConfig, type Plugin } from 'vite'

import { clarifyPlugin } from './index.js'
import type { ClarifyGenerateOptions } from './types.js'

const DEFAULT_HTML = '<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Clarify</title></head><body><div id="root"></div></body></html>'

type ParsedArgs = {
  command?: string
  flags: Record<string, string | boolean>
  positionals: string[]
}

type CliOptions = {
  root: string
  content: string
  output: string
  host?: string | boolean
  port?: number
  open?: boolean | string
}

function parseArgs(argv: string[]): ParsedArgs {
  let command: string | undefined
  const flags: Record<string, string | boolean> = {}
  const positionals: string[] = []

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) {
      if (!command) {
        command = arg
      } else {
        positionals.push(arg)
      }
      continue
    }

    const [rawKey, inlineValue] = arg.slice(2).split('=', 2)
    const key = rawKey.trim()
    if (!key) continue

    if (inlineValue !== undefined) {
      flags[key] = inlineValue
      continue
    }

    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      flags[key] = next
      i += 1
    } else {
      flags[key] = true
    }
  }

  return { command, flags, positionals }
}

function readPackageVersion(): string {
  try {
    const packageJsonPath = resolve(dirname(fileURLToPath(import.meta.url)), '../package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as { version?: string }
    return packageJson.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

function printHelp(): void {
  console.log(`Clarify ${readPackageVersion()}

Usage:
  clarify dev [options]
  clarify build [options]
  clarify init [options]

Commands:
  dev              Start the local documentation server
  build            Build the static documentation site
  init             Create a minimal Clarify project scaffold

Options:
  --root <dir>     Project root directory (default: current directory)
  --content <dir>  Content directory relative to root (default: source/content)
  --output <dir>   Build output directory relative to root (default: output)
  --host [host]    Dev server host
  --port <port>    Dev server port
  --open [path]    Open the dev server in a browser
  --force          Overwrite files created by init
  --help           Show help
  --version        Show version`)
}

function parseCliOptions(flags: Record<string, string | boolean>): CliOptions {
  const root = resolve(String(flags.root ?? process.cwd()))
  const portValue = flags.port
  const openValue = flags.open

  return {
    root,
    content: String(flags.content ?? 'source/content'),
    output: String(flags.output ?? 'output'),
    host: typeof flags.host === 'string' ? flags.host : flags.host === true ? true : undefined,
    port: typeof portValue === 'string' ? Number.parseInt(portValue, 10) : undefined,
    open: typeof openValue === 'string' ? openValue : openValue === true ? true : undefined,
  }
}

function ensureHtmlEntry(root: string): string {
  const projectHtmlPath = resolve(root, 'index.html')
  if (existsSync(projectHtmlPath)) return projectHtmlPath

  const generatedHtmlPath = resolve(root, '.clarify/index.html')
  mkdirSync(dirname(generatedHtmlPath), { recursive: true })
  writeFileSync(generatedHtmlPath, DEFAULT_HTML, 'utf-8')
  return generatedHtmlPath
}

function createHtmlFallbackPlugin(): Plugin {
  return {
    name: 'clarify:cli-html-fallback',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const requestPath = req.url?.split('?')[0] ?? '/'
        const acceptsHtml = req.headers.accept?.includes('text/html') ?? false
        const hasFileExtension = /\.[^/]+$/.test(requestPath)
        if (!acceptsHtml || hasFileExtension) {
          next()
          return
        }

        try {
          const html = await server.transformIndexHtml(requestPath, DEFAULT_HTML)
          res.statusCode = 200
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.end(html)
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

function createViteConfig(options: CliOptions): InlineConfig {
  const entryHtmlPath = ensureHtmlEntry(options.root)
  const generateOptions: ClarifyGenerateOptions = {
    projectRoot: options.root,
    rootDirectory: options.content,
    outputDirectory: options.output,
  }

  return {
    root: options.root,
    configFile: false,
    appType: 'custom',
    plugins: [
      clarifyPlugin(generateOptions),
      createHtmlFallbackPlugin(),
    ],
    server: {
      host: options.host,
      port: options.port,
      open: options.open,
    },
    build: {
      outDir: options.output,
      rollupOptions: {
        input: {
          index: entryHtmlPath,
        },
      },
    },
  }
}

function writeJsonFile(filePath: string, value: unknown, force: boolean): boolean {
  if (existsSync(filePath) && !force) return false
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8')
  return true
}

function writeTextFile(filePath: string, content: string, force: boolean): boolean {
  if (existsSync(filePath) && !force) return false
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, content, 'utf-8')
  return true
}

function updatePackageJson(root: string, force: boolean): boolean {
  const packageJsonPath = resolve(root, 'package.json')
  const packageJson = existsSync(packageJsonPath)
    ? JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as Record<string, unknown>
    : { type: 'module' }

  const scripts = typeof packageJson.scripts === 'object' && packageJson.scripts !== null
    ? packageJson.scripts as Record<string, string>
    : {}

  if (force || !scripts.dev) scripts.dev = 'clarify dev'
  if (force || !scripts.build) scripts.build = 'clarify build'
  packageJson.scripts = scripts

  const devDependencies = typeof packageJson.devDependencies === 'object' && packageJson.devDependencies !== null
    ? packageJson.devDependencies as Record<string, string>
    : {}
  if (!devDependencies['@clarify/cli']) devDependencies['@clarify/cli'] = '^0.1.0'
  packageJson.devDependencies = devDependencies

  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf-8')
  return true
}

async function runDev(options: CliOptions): Promise<void> {
  const server = await createServer(createViteConfig(options))
  await server.listen()
  server.printUrls()
  server.bindCLIShortcuts({ print: true })
}

async function runBuild(options: CliOptions): Promise<void> {
  await viteBuild(createViteConfig(options))
}

function runInit(options: CliOptions, force: boolean): void {
  const created: string[] = []
  const skipped: string[] = []

  const clarifyConfigCreated = writeJsonFile(resolve(options.root, 'clarify.json'), {
    title: 'Clarify Docs',
    description: 'Documentation powered by Clarify',
    theme: { primary: '#0ea5e9' },
  }, force)
  ;(clarifyConfigCreated ? created : skipped).push('clarify.json')

  const contentCreated = writeTextFile(resolve(options.root, options.content, 'index.mdx'), `---
title: Welcome
---

# Welcome to Clarify

Start writing your documentation in \`${options.content}\`.
`, force)
  ;(contentCreated ? created : skipped).push(`${options.content}/index.mdx`)

  const packageJsonUpdated = updatePackageJson(options.root, force)
  if (packageJsonUpdated) created.push('package.json')

  console.log('[clarify] Init complete.')
  if (created.length > 0) console.log(`[clarify] Created or updated: ${created.join(', ')}`)
  if (skipped.length > 0) console.log(`[clarify] Skipped existing files: ${skipped.join(', ')}. Use --force to overwrite.`)
}

async function main(): Promise<void> {
  const { command, flags } = parseArgs(process.argv.slice(2))

  if (flags.version || command === 'version') {
    console.log(readPackageVersion())
    return
  }

  if (!command || command === 'help' || flags.help) {
    printHelp()
    return
  }

  const options = parseCliOptions(flags)

  if (command === 'dev') {
    await runDev(options)
    return
  }

  if (command === 'build') {
    await runBuild(options)
    return
  }

  if (command === 'init') {
    runInit(options, flags.force === true)
    return
  }

  console.error(`[clarify] Unknown command: ${command}`)
  printHelp()
  process.exitCode = 1
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
