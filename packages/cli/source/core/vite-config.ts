import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import type { ConfigEnv, InlineConfig, Plugin } from 'vite'

import type { ClarifyBuildOptions } from './options.js'
import { clarifyPlugin } from './plugin.js'
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
      rollupOptions: {
        input: {
          index: entryHtmlPath,
        },
      },
    },
  }
}
