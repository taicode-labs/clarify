import { isAbsolute, join, relative } from 'node:path'

import mdxPlugin, { type Options as MdxPluginOptions } from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'

import { rehypePlugins, remarkPlugins } from '../../parsers/markdown/mdx.js'
import { CLARIFY_DEV_ROUTE_ENDPOINT, handleDevRouteRequest } from '../../parsers/router/dev-routes.js'
import type { ClarifyBuildOptions } from '../config/options.js'
import { type ClarifyEngine, createClarifyEngine } from '../engine/engine.js'
import { resolveProjectContext } from '../project/project-context.js'
import { CLARIFY_DEV_PROJECT_INFO_ENDPOINT, handleProjectInfoRequest } from '../project/project-info.js'
import {
  RESOLVED_CLIENT_ENTRY,
  VIRTUAL_CLIENT_ENTRY,
  VIRTUAL_CONFIG,
  VIRTUAL_OPENAPI,
  VIRTUAL_ROUTES,
  VIRTUAL_SERVER_ROUTES,
  VIRTUAL_SLOT,
  VIRTUAL_SLOTS,
  resolveVirtualId,
  stripVirtualPrefix,
} from '../runtime/virtual-modules.js'
import { runHooks } from '../plugin/hooks.js'

export type ClarifyViteBridgeOptions = {
  engine?: ClarifyEngine
}

function invalidateVirtualModules(engine: ClarifyEngine, server: ViteDevServer): void {
  for (const id of engine.modules.keys()) {
    const moduleNode = server.moduleGraph.getModuleById(resolveVirtualId(id))
    if (moduleNode) server.moduleGraph.invalidateModule(moduleNode)
  }
}

async function refreshDevServer(engine: ClarifyEngine, server: ViteDevServer): Promise<void> {
  await engine.refresh()
  invalidateVirtualModules(engine, server)
  server.ws.send({ type: 'full-reload' })
}

function createNormalizedMdxContentPlugin(engine: ClarifyEngine): Plugin {
  return {
    name: 'clarify:normalized-mdx-content',
    enforce: 'pre',
    transform(_code, id) {
      if (!/\.mdx?(?:\?|$)/.test(id)) return null
      const filePath = id.replace(/\?.*$/, '')
      const route = engine.routes.find(route => route.kind === 'mdx' && route.filePath === filePath)
      if (!route || route.content === undefined) return null
      return { code: route.content, map: null }
    },
  }
}

function createMdxPlugin(): Plugin {
  return mdxPlugin({
    include: ['**/*.{md,mdx}'],
    jsxImportSource: 'react',
    providerImportSource: '@clarify-labs/renderer',
    remarkPlugins: remarkPlugins as MdxPluginOptions['remarkPlugins'],
    rehypePlugins,
  }) as Plugin
}

function createClarifyViteCorePlugin(engine: ClarifyEngine, options: ClarifyBuildOptions, normalizedMdxContentPlugin: Plugin, mdx: Plugin): Plugin {
  let viteConfig: ResolvedConfig

  return {
    name: 'clarify:core',
    async config() {
      engine.configureRuntime({ command: 'build', mode: 'production' })
      await engine.discoverSite()
      engine.logStartupHints()

      return {
        base: engine.projectConfig.assetPrefix,
        build: {
          ...(engine.generateOptions.outputDirectory ? { outDir: engine.generateOptions.outputDirectory } : {}),
          manifest: true,
        },
      }
    },
    configResolved(config) {
      viteConfig = config
      engine.configureRuntime({
        command: config.command,
        mode: config.mode,
        outputDirectory: config.build.outDir,
      })
      if (!engine.generateOptions.outputDirectory) {
        engine.generateOptions.outputDirectory = config.build.outDir
      }
    },
    async buildStart() {
      if (!(await engine.beginBuild())) return
      await engine.buildModules()
      engine.writeEnvTypes()
    },
    async handleHotUpdate(ctx) {
      const changedFile = isAbsolute(ctx.file) ? ctx.file : join(engine.root, ctx.file)
      if (engine.configFilePath && changedFile === engine.configFilePath) {
        const newContext = await resolveProjectContext({
          ...options,
          projectRoot: engine.root,
          rootDirectory: options.rootDirectory,
          outputDirectory: options.outputDirectory,
        }, { command: 'serve', mode: viteConfig.mode })
        await engine.refresh({
          ...newContext.config,
          projectRoot: newContext.projectRoot,
          rootDirectory: newContext.buildOptions.rootDirectory,
          outputDirectory: newContext.buildOptions.outputDirectory,
        })
        invalidateVirtualModules(engine, ctx.server)
        ctx.server.ws.send({ type: 'full-reload' })
        return []
      }

      const relativeContentFile = relative(engine.contentRoot, changedFile)
      const isContentFile = relativeContentFile && !relativeContentFile.startsWith('..') && !isAbsolute(relativeContentFile)
      if (!isContentFile || !engine.hasContentRouteForFile(changedFile)) return

      await refreshDevServer(engine, ctx.server)
      return []
    },
    resolveId(id) {
      if (id === VIRTUAL_CLIENT_ENTRY || id === RESOLVED_CLIENT_ENTRY) return RESOLVED_CLIENT_ENTRY
      if (id === VIRTUAL_CONFIG || id === resolveVirtualId(VIRTUAL_CONFIG)) return resolveVirtualId(VIRTUAL_CONFIG)
      if (id === VIRTUAL_ROUTES || id === resolveVirtualId(VIRTUAL_ROUTES)) return resolveVirtualId(VIRTUAL_ROUTES)
      if (id === VIRTUAL_SERVER_ROUTES || id === resolveVirtualId(VIRTUAL_SERVER_ROUTES)) return resolveVirtualId(VIRTUAL_SERVER_ROUTES)
      if (id === VIRTUAL_OPENAPI || id === resolveVirtualId(VIRTUAL_OPENAPI)) return resolveVirtualId(VIRTUAL_OPENAPI)
      if (id === VIRTUAL_SLOTS || id === resolveVirtualId(VIRTUAL_SLOTS)) return resolveVirtualId(VIRTUAL_SLOTS)
      if (id === VIRTUAL_SLOT || id === resolveVirtualId(VIRTUAL_SLOT)) return resolveVirtualId(VIRTUAL_SLOT)
      const moduleId = stripVirtualPrefix(id)
      if (engine.modules.has(moduleId)) return resolveVirtualId(moduleId)
      const route = engine.routes.find(route => route.virtualModuleId === id || route.virtualModuleId === moduleId)
      if (route) return resolveVirtualId(route.virtualModuleId)
      return null
    },
    load(id) {
      return engine.loadModule(id)
    },
    async configureServer(server) {
      server.watcher.add(engine.contentRoot)
      if (engine.configFilePath) server.watcher.add(engine.configFilePath)

      server.middlewares.use((req, res, next) => {
        if (req.url === CLARIFY_DEV_ROUTE_ENDPOINT && req.method === 'POST') {
          return handleDevRouteRequest(req, res, engine.routes, engine.runtimeContext())
        }
        if (req.url === CLARIFY_DEV_PROJECT_INFO_ENDPOINT && (req.method === 'GET' || req.method === 'HEAD')) {
          return handleProjectInfoRequest(req, res, engine.runtimeContext())
        }
        next()
      })

      const handleContentTreeChange = async (filePath: string) => {
        const changedFile = isAbsolute(filePath) ? filePath : join(engine.root, filePath)
        const relativeContentFile = relative(engine.contentRoot, changedFile)
        const isContentFile = relativeContentFile && !relativeContentFile.startsWith('..') && !isAbsolute(relativeContentFile)
        if (!isContentFile) return
        await refreshDevServer(engine, server)
      }

      server.watcher.on('add', handleContentTreeChange)
      server.watcher.on('unlink', handleContentTreeChange)
      await engine.configureDevServer(server)
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html, transformCtx) {
        const clientEntryId = transformCtx.server
          ? `/@id/${VIRTUAL_CLIENT_ENTRY}`
          : VIRTUAL_CLIENT_ENTRY
        const result = await runHooks(engine.plugins, 'html:transform', {
          html,
          tags: [],
          clientEntryId,
          dev: Boolean(transformCtx.server),
        }, engine.hookContext)
        return {
          html: result.html,
          tags: result.tags,
        }
      },
    },
    async generateBundle() {
      const assets = await engine.collectBuildAssets()
      for (const asset of assets) {
        this.emitFile({
          type: 'asset',
          fileName: asset.fileName,
          source: asset.source,
        })
      }
      await engine.endBuild()
    },
    async closeBundle() {
      if (!engine.shouldRunBuild()) return
      engine.configureRuntime({
        outputDirectory: viteConfig.build.outDir,
        ssrPlugins: [engine.createSSGVirtualPlugin(), normalizedMdxContentPlugin, mdx],
      })
      await engine.runSSG()
    },
  }
}

export function createViteAdapter(options: ClarifyBuildOptions = {}, bridgeOptions: ClarifyViteBridgeOptions = {}): Plugin[] {
  const engine = bridgeOptions.engine ?? createClarifyEngine(options)
  const normalizedMdxContentPlugin = createNormalizedMdxContentPlugin(engine)
  const mdx = createMdxPlugin()
  return [
    react(),
    tailwindcss(),
    normalizedMdxContentPlugin,
    createClarifyViteCorePlugin(engine, options, normalizedMdxContentPlugin, mdx),
    mdx,
  ].flat().filter(Boolean) as Plugin[]
}
