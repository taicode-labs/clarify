import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { createLogger } from 'vite'
import type { ConfigEnv, InlineConfig, Plugin, LogLevel, Logger, LogOptions, LogErrorOptions, LogType } from 'vite'

import { logBuildErrorSync } from './log.js'
import type { ClarifyBuildOptions } from './options.js'
import { clarifyPlugin } from './plugin.js'
import { createClarifyRuntimeAliases } from './runtime-deps.js'
import { loadClarifyConfig } from './user-config.js'

export type ClarifyViteConfigOptions = {
  root: string
  content: string
  output: string
  host?: string | boolean
  port?: number
  open?: boolean | string
}

const DEFAULT_HTML = '<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Clarify</title></head><body><div id="root"></div></body></html>'

function ensureHtmlEntry(root: string): string {
  const projectHtmlPath = resolve(root, 'index.html')
  if (existsSync(projectHtmlPath)) return projectHtmlPath

  const generatedHtmlPath = resolve(root, '.clarify/index.html')
  mkdirSync(dirname(generatedHtmlPath), { recursive: true })
  writeFileSync(generatedHtmlPath, DEFAULT_HTML, 'utf-8')
  return generatedHtmlPath
}

function createClarifyLogger(root: string, env: ConfigEnv, level: LogLevel): Logger | undefined {
  if (env.command !== 'build') return undefined

  const baseLogger = createLogger(level, { allowClearScreen: true })

  return {
    info(msg: string, options?: LogOptions) {
      baseLogger.info(msg, options)
    },
    warn(msg: string, options?: LogOptions) {
      baseLogger.warn(msg, options)
    },
    warnOnce(msg: string, options?: LogOptions) {
      baseLogger.warnOnce(msg, options)
    },
    error(msg: string, options?: LogErrorOptions) {
      baseLogger.error(msg, options)
      if (options?.error) {
        logBuildErrorSync(root, options.error)
      } else {
        logBuildErrorSync(root, typeof msg === 'string' ? new Error(msg) : msg)
      }
    },
    clearScreen(type: LogType) {
      baseLogger.clearScreen(type)
    },
    hasErrorLogged(error: Error | unknown) {
      return baseLogger.hasErrorLogged(error as Error)
    },
    get hasWarned() {
      return baseLogger.hasWarned
    },
  }
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

export async function createViteConfig(options: ClarifyViteConfigOptions, env: ConfigEnv): Promise<InlineConfig> {
  const entryHtmlPath = ensureHtmlEntry(options.root)
  const userConfig = await loadClarifyConfig(options.root, env)
  const buildOptions: ClarifyBuildOptions = {
    ...userConfig,
    projectRoot: options.root,
    rootDirectory: options.content,
    outputDirectory: options.output,
  }

  return {
    root: options.root,
    configFile: false,
    appType: 'custom',
    resolve: {
      alias: createClarifyRuntimeAliases(),
    },
    customLogger: createClarifyLogger(options.root, env, 'info'),
    plugins: [
      clarifyPlugin(buildOptions),
      createHtmlFallbackPlugin(),
    ],
    server: {
      host: options.host,
      port: options.port,
      open: options.open,
    },
    build: {
      outDir: options.output,
      rolldownOptions: {
        input: {
          index: entryHtmlPath,
        },
        checks: {
          pluginTimings: false,
        },
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'react-vendor',
                test: /node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
                priority: 40,
              },
              {
                name: 'icons-vendor',
                test: /node_modules[\\/]lucide-react[\\/]/,
                priority: 35,
              },
              {
                name: 'ui-vendor',
                test: /node_modules[\\/](@headlessui|framer-motion)[\\/]/,
                priority: 30,
              },
              {
                name: 'vendor',
                test: /node_modules[\\/]/,
                priority: 10
              },
            ],
          },
        },
      },
    },
  }
}
