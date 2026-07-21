import { isAbsolute, join, relative } from 'node:path'

import mdxPlugin, { type Options as MdxPluginOptions } from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import rehypeRaw from 'rehype-raw'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'

import { createContentCompileDiagnostic, rehypePlugins, remarkPlugins } from '../parsers/markdown/mdx.js'
import { CLARIFY_DEV_ROUTE_ENDPOINT, handleDevRouteRequest } from '../parsers/router/dev-routes.js'
import type { ContentRoute, NavigationTree } from '../types.js'

import { type ClarifyEngine } from './engine/engine.js'
import { CLARIFY_DEV_PROJECT_INFO_ENDPOINT, handleProjectInfoRequest } from './project/project-info.js'
import {
  VIRTUAL_CLIENT_ENTRY,
  VIRTUAL_ROUTES,
  generateContentDiagnosticModule,
  resolveVirtualId,
  resolveVirtualModuleId,
} from './runtime/virtual-modules.js'

type DevStructureSnapshot = {
  routes: string
  navigation: string
}

function routeStructure(route: ContentRoute): ContentRoute {
  const { content: _content, ...source } = route.source
  return { ...route, source }
}

function createDevStructureSnapshot(routes: ContentRoute[], navigation: NavigationTree): DevStructureSnapshot {
  return {
    routes: JSON.stringify(routes.map(routeStructure)),
    navigation: JSON.stringify(navigation),
  }
}

function hasDevStructureChanged(before: DevStructureSnapshot, after: DevStructureSnapshot): boolean {
  return before.routes !== after.routes || before.navigation !== after.navigation
}

function invalidateVirtualModules(engine: ClarifyEngine, server: ViteDevServer): void {
  for (const id of engine.modules.keys()) {
    const moduleNode = server.moduleGraph.getModuleById(resolveVirtualId(id))
    if (moduleNode) server.moduleGraph.invalidateModule(moduleNode)
  }
}

async function refreshDevServer(engine: ClarifyEngine, server: ViteDevServer): Promise<boolean> {
  const before = createDevStructureSnapshot(engine.routes, engine.navigation)
  await engine.refresh()
  invalidateVirtualModules(engine, server)
  const after = createDevStructureSnapshot(engine.routes, engine.navigation)
  return hasDevStructureChanged(before, after)
}

function createNormalizedContentPlugin(engine: ClarifyEngine): Plugin {
  return {
    name: 'clarify:normalized-content',
    enforce: 'pre',
    transform(_code, id) {
      if (!/\.mdx?(?:\?|$)/.test(id)) return null
      const filePath = id.replace(/\?.*$/, '')
      const route = engine.routes.find(route => (route.kind === 'markdown+jsx' || route.kind === 'markdown') && route.source.filePath === filePath)
      if (!route || route.source.content === undefined) return null
      return { code: route.source.content, map: null }
    },
  }
}

type ContentFormat = 'markdown' | 'markdown+jsx'
type ContentCompileErrorPolicy = 'diagnostic' | 'throw'
type TransformHook = NonNullable<Plugin['transform']> extends infer Hook ? Hook extends (...args: never[]) => unknown ? Hook : never : never

export function createContentCompileTransform(transform: TransformHook, format: ContentFormat, projectRoot: string, errorPolicy: () => ContentCompileErrorPolicy = () => 'diagnostic'): NonNullable<Plugin['transform']> {
  return async function contentCompileTransform(code, id) {
    try {
      return await transform.call(this, code, id)
    } catch (error) {
      if (errorPolicy() === 'throw') throw error
      const filePath = id.replace(/\?.*$/, '')
      return {
        code: generateContentDiagnosticModule(createContentCompileDiagnostic({
          format,
          phase: 'compilation',
          error,
          filePath,
          projectRoot,
        })),
        map: null,
      }
    }
  }
}

function createContentCompilerPlugin(format: ContentFormat, projectRoot: string, errorPolicy: () => ContentCompileErrorPolicy): Plugin {
  const markdown = format === 'markdown'
  const plugin = mdxPlugin({
    include: [markdown ? '**/*.md' : '**/*.mdx'],
    format: markdown ? 'md' : 'mdx',
    jsxImportSource: 'react',
    providerImportSource: '@clarify-labs/renderer',
    remarkPlugins: remarkPlugins as MdxPluginOptions['remarkPlugins'],
    ...(markdown ? { remarkRehypeOptions: { allowDangerousHtml: true } } : {}),
    rehypePlugins: markdown ? [rehypeRaw, ...rehypePlugins] : rehypePlugins,
  }) as Plugin
  const transform = typeof plugin.transform === 'function' ? plugin.transform : plugin.transform?.handler

  if (!transform) return plugin

  return {
    ...plugin,
    transform: createContentCompileTransform(transform, format, projectRoot, errorPolicy),
  }
}

function createClarifyViteCorePlugin(engine: ClarifyEngine, normalizedContentPlugin: Plugin, markdown: Plugin, mdx: Plugin): Plugin {
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

      const structureChanged = await refreshDevServer(engine, ctx.server)
      if (structureChanged) {
        const routesModule = ctx.server.moduleGraph.getModuleById(resolveVirtualId(VIRTUAL_ROUTES))
        if (routesModule) return [...ctx.modules, routesModule]
        ctx.server.ws.send({ type: 'full-reload' })
        return []
      }
      return ctx.modules
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
        const shouldReload = await refreshDevServer(engine, server)
        if (shouldReload) server.ws.send({ type: 'full-reload' })
      }

      server.watcher.on('add', handleContentTreeChange)
      server.watcher.on('unlink', handleContentTreeChange)
      const postHooks = await engine.configureDevServer(server)
      if (postHooks.length > 0) {
        return () => {
          for (const postHook of postHooks) postHook()
        }
      }
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
        ssrPlugins: [engine.createSSGVirtualPlugin(), normalizedContentPlugin, markdown, mdx],
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
  let contentCompileErrorPolicy: ContentCompileErrorPolicy = 'diagnostic'
  const errorPolicy = () => contentCompileErrorPolicy
  const normalizedContentPlugin = createNormalizedContentPlugin(engine)
  const markdown = createContentCompilerPlugin('markdown', engine.root, errorPolicy)
  const mdx = createContentCompilerPlugin('markdown+jsx', engine.root, errorPolicy)
  const compilePolicyPlugin: Plugin = {
    name: 'clarify:content-compile-policy',
    configResolved(config) {
      contentCompileErrorPolicy = config.command === 'build' ? 'throw' : 'diagnostic'
    },
  }
  // `react()` returns `Plugin[]`; `tailwindcss()` returns `Plugin | Plugin[]`;
  // the rest return a single `Plugin`. Spread the array-returning results so
  // every element is a `Plugin`, avoiding the `.flat().filter(Boolean) as
  // Plugin[]` escape hatch.
  const tailwind = tailwindcss()
  return [
    ...react(),
    ...(Array.isArray(tailwind) ? tailwind : [tailwind]),
    compilePolicyPlugin,
    normalizedContentPlugin,
    createClarifyViteCorePlugin(engine, normalizedContentPlugin, markdown, mdx),
    markdown,
    mdx,
  ]
}
