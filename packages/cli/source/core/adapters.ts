import { isAbsolute, join, relative } from 'node:path'

import mdxPlugin, { type Options as MdxPluginOptions } from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'

import { rehypePlugins, remarkPlugins } from '../parsers/markdown/mdx.js'
import { CLARIFY_DEV_ROUTE_ENDPOINT, handleDevRouteRequest } from '../parsers/router/dev-routes.js'

import { type ClarifyEngine } from './engine/engine.js'
import { CLARIFY_DEV_PROJECT_INFO_ENDPOINT, handleProjectInfoRequest } from './project/project-info.js'
import {
  VIRTUAL_CLIENT_ENTRY,
  resolveVirtualId,
  resolveVirtualModuleId,
} from './runtime/virtual-modules.js'

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

function createClarifyViteCorePlugin(engine: ClarifyEngine, normalizedMdxContentPlugin: Plugin, mdx: Plugin): Plugin {
  let viteConfig: ResolvedConfig

  return {
    name: 'clarify:core',
    async config() {
      // The engine is already prepared (initialize + discoverSite + buildModules)
      // by the caller before constructing the Vite config. The adapter only
      // contributes Vite-level settings derived from the prepared engine state.
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
      engine.writeEnvTypes()
    },
    async handleHotUpdate(ctx) {
      const changedFile = isAbsolute(ctx.file) ? ctx.file : join(engine.root, ctx.file)
      if (engine.configFilePath && changedFile === engine.configFilePath) {
        // Config file changed: force re-prepare (initialize + discoverSite +
        // buildModules) with the current runtime mode, then reload.
        await engine.prepare({ command: 'serve', mode: viteConfig.mode }, engine.options, { force: true })
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
      return resolveVirtualModuleId(id, engine.modules, engine.routes)
    },
    load(id) {
      return engine.loadModule(id)
    },
    async configureServer(server) {
      server.watcher.add(engine.contentRoot)
      if (engine.configFilePath) server.watcher.add(engine.configFilePath)

      // Register Context change listeners to automatically invalidate virtual
      // modules and trigger full-reload when routes or navigation change.
      const invalidateAndReload = () => {
        invalidateVirtualModules(engine, server)
        server.ws.send({ type: 'full-reload' })
      }
      engine.ctx.onRoutesChange(invalidateAndReload)
      engine.ctx.onNavigationChange(invalidateAndReload)

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
        const result = await engine.transformHtml({
          html,
          tags: [],
          clientEntryId,
          dev: Boolean(transformCtx.server),
        })
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

/**
 * Creates the Clarify Vite plugins bound to an already-prepared engine.
 *
 * The caller is responsible for running `engine.prepare()` (initialize +
 * discoverSite + buildModules) before constructing the Vite config that
 * includes these plugins. The adapter never initializes or discovers the
 * site itself - it only bridges Vite lifecycle hooks to the engine.
 */
export function createViteAdapter(engine: ClarifyEngine): Plugin[] {
  const normalizedMdxContentPlugin = createNormalizedMdxContentPlugin(engine)
  const mdx = createMdxPlugin()
  return [
    react(),
    tailwindcss(),
    normalizedMdxContentPlugin,
    createClarifyViteCorePlugin(engine, normalizedMdxContentPlugin, mdx),
    mdx,
  ].flat().filter(Boolean) as Plugin[]
}
