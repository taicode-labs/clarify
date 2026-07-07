import { existsSync, rmSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'

import { cliPackageVersion } from '../../cli/package.js'
import type { ClarifyHookContext, ClarifyPlugin, ContentRoute, NavigationTree } from '../../types.js'
import { writeClarifyEnvDts } from '../config/env-types.js'
import { resolveProjectConfig } from '../config/index.js'
import { resolveBuildOptions, type ClarifyBuildOptions } from '../config/options.js'
import { findClarifyConfigFile } from '../config/user-config.js'
import { runBuildAssetsHooks, runBuildDoneHooks, runDevConfigureServerHooks, runHooks } from '../content/hooks.js'
import { resolveProjectContext } from '../project/project-context.js'
import { CLARIFY_DEV_PROJECT_INFO_ENDPOINT, handleProjectInfoRequest } from '../project/project-info.js'
import { logStartupHints } from '../project/startup.js'
import { CLARIFY_DEV_ROUTE_ENDPOINT, handleDevRouteRequest } from '../site/dev-routes.js'
import { resolveClarifySite } from '../site/index.js'
import {
  STATIC_PAGE_ENTRY_CODE,
  createTempEntryFile,
  buildSSRBundle,
  buildStaticPages,
} from '../site/page-builder.js'
import {
  RESOLVED_CLIENT_ENTRY,
  VIRTUAL_CLIENT_ENTRY,
  VIRTUAL_CONFIG,
  VIRTUAL_ROUTES,
  VIRTUAL_SERVER_ROUTES,
  VIRTUAL_OPENAPI,
  VIRTUAL_SLOTS,
  VIRTUAL_SLOT,
  buildVirtualModules,
  resolveVirtualId,
  stripVirtualPrefix,
  type VirtualModules,
} from '../site/virtual-modules.js'

import { createBuiltinPlugins } from './builtin.js'

function loadVirtualModule(id: string, modules: VirtualModules): string | null {
  const bareId = stripVirtualPrefix(id)
  return modules.get(bareId) ?? modules.get(id) ?? null
}

export function clarifyPlugin(options: ClarifyBuildOptions = {}): Plugin[] {
  const root = resolve(options.projectRoot ?? process.cwd())
  let projectConfig = resolveProjectConfig(options)
  let generateOptions = resolveBuildOptions(options)
  let contentRoot = join(root, generateOptions.rootDirectory)
  let runtimeContext = { projectRoot: root, contentRoot, projectConfig, generateOptions, version: cliPackageVersion }
  const configFilePath = findClarifyConfigFile(root)
  let routes: ContentRoute[] = []

  let clarifyPlugins: ClarifyPlugin[] = [...createBuiltinPlugins(), ...(options.plugins ?? [])]
  const ctx: ClarifyHookContext = {
    projectRoot: root,
    contentRoot,
    projectConfig,
    generateOptions,
    version: cliPackageVersion,
    routes,
    navigation: [],
  }
  let viteConfig: ResolvedConfig
  let resolvedNavigation: NavigationTree = []
  let virtualModules: VirtualModules = new Map()

  async function resolveRoutesAndSpecs(overrides?: ClarifyBuildOptions) {
    const site = await resolveClarifySite(overrides ?? options)
    projectConfig = site.projectConfig
    generateOptions = site.generateOptions
    contentRoot = join(root, generateOptions.rootDirectory)
    runtimeContext = { projectRoot: root, contentRoot, projectConfig, generateOptions, version: cliPackageVersion }
    routes = site.routes
    resolvedNavigation = site.navigation
    clarifyPlugins = site.plugins
    ctx.projectRoot = root
    ctx.contentRoot = contentRoot
    ctx.projectConfig = projectConfig
    ctx.generateOptions = generateOptions
    ctx.version = cliPackageVersion
    ctx.routes = routes
    ctx.navigation = resolvedNavigation
  }

  async function rebuildVirtualModules() {
    virtualModules = buildVirtualModules({
      projectConfig,
      generateOptions,
      routes,
      navigation: resolvedNavigation,
      plugins: clarifyPlugins,
      themeEditor: viteConfig.command === 'serve' || projectConfig.theme.editor,
      version: ctx.version,
    })
    virtualModules = await runHooks(clarifyPlugins, 'modules:before', virtualModules, ctx)
  }

  function invalidateVirtualModules(server: ViteDevServer) {
    for (const id of virtualModules.keys()) {
      const moduleNode = server.moduleGraph.getModuleById(resolveVirtualId(id))
      if (moduleNode) server.moduleGraph.invalidateModule(moduleNode)
    }
  }

  async function refreshDevServer(server: ViteDevServer) {
    await resolveRoutesAndSpecs()
    await rebuildVirtualModules()
    invalidateVirtualModules(server)
    server.ws.send({ type: 'full-reload' })
  }

  function hasContentRouteForFile(filePath: string): boolean {
    return routes.some(route => route.filePath === filePath)
  }

  const clarifyCorePlugin: Plugin = {
    name: 'clarify:core',
    async config() {
      await resolveRoutesAndSpecs()
      logStartupHints({
        projectRoot: root,
        contentRoot,
        contentDirExists: existsSync(contentRoot),
        hasRoutes: routes.length > 0,
      })

      return {
        base: projectConfig.assetPrefix,
        build: {
          ...(generateOptions.outputDirectory ? { outDir: generateOptions.outputDirectory } : {}),
          manifest: true,
        },
      }
    },
    configResolved(config) {
      viteConfig = config
      // If user didn't specify outputDirectory, read it from Vite's resolved config
      if (!generateOptions.outputDirectory) {
        generateOptions.outputDirectory = config.build.outDir
      }
    },
    async buildStart() {
      await rebuildVirtualModules()
      writeClarifyEnvDts(root, clarifyPlugins)
    },
    async handleHotUpdate(ctx) {
      const changedFile = isAbsolute(ctx.file) ? ctx.file : join(root, ctx.file)
      if (configFilePath && changedFile === configFilePath) {
        const newContext = await resolveProjectContext({
          ...options,
          projectRoot: root,
          rootDirectory: options.rootDirectory,
          outputDirectory: options.outputDirectory,
        }, { command: 'serve', mode: viteConfig.mode })
        projectConfig = newContext.projectConfig
        generateOptions = newContext.buildOptions
        contentRoot = newContext.contentRoot
        await resolveRoutesAndSpecs({
          ...newContext.config,
          projectRoot: newContext.projectRoot,
          rootDirectory: newContext.buildOptions.rootDirectory,
          outputDirectory: newContext.buildOptions.outputDirectory,
        })
        await rebuildVirtualModules()
        invalidateVirtualModules(ctx.server)
        ctx.server.ws.send({ type: 'full-reload' })
        return []
      }

      const relativeContentFile = relative(contentRoot, changedFile)
      const isContentFile = relativeContentFile && !relativeContentFile.startsWith('..') && !isAbsolute(relativeContentFile)
      if (!isContentFile || !hasContentRouteForFile(changedFile)) return

      await refreshDevServer(ctx.server)
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
      if (virtualModules.has(moduleId)) return resolveVirtualId(moduleId)
      const route = routes.find(r => r.virtualModuleId === id || r.virtualModuleId === moduleId)
      if (route) return resolveVirtualId(route.virtualModuleId)
      return null
    },
    load(id) {
      return loadVirtualModule(id, virtualModules)
    },
    async configureServer(server) {
      server.watcher.add(contentRoot)
      if (configFilePath) {
        server.watcher.add(configFilePath)
      }

      // Dev-only endpoints for external tooling (e.g. VS Code extension).
      // Need to match exact paths, so check req.url before handling.
      server.middlewares.use((req, res, next) => {
        if (req.url === CLARIFY_DEV_ROUTE_ENDPOINT && req.method === 'POST') {
          return handleDevRouteRequest(req, res, routes, runtimeContext)
        }
        if (req.url === CLARIFY_DEV_PROJECT_INFO_ENDPOINT && (req.method === 'GET' || req.method === 'HEAD')) {
          return handleProjectInfoRequest(req, res, runtimeContext)
        }
        next()
      })

      const handleContentTreeChange = async (filePath: string) => {
        const changedFile = isAbsolute(filePath) ? filePath : join(root, filePath)
        const relativeContentFile = relative(contentRoot, changedFile)
        const isContentFile = relativeContentFile && !relativeContentFile.startsWith('..') && !isAbsolute(relativeContentFile)
        if (!isContentFile) return
        await refreshDevServer(server)
      }

      server.watcher.on('add', handleContentTreeChange)
      server.watcher.on('unlink', handleContentTreeChange)
      await runDevConfigureServerHooks(clarifyPlugins, server, ctx)
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html, transformCtx) {
        // In dev mode, use /@id/ prefix so Vite dev server can resolve the virtual module.
        // In build mode, use the bare virtual: ID so Vite's HTML build pipeline resolves it via resolveId.
        const clientEntryId = transformCtx.server
          ? `/@id/${VIRTUAL_CLIENT_ENTRY}`
          : VIRTUAL_CLIENT_ENTRY
        const result = await runHooks(clarifyPlugins, 'html:transform', {
          html,
          tags: [],
          clientEntryId,
          dev: Boolean(transformCtx.server),
        }, ctx)
        return {
          html: result.html,
          tags: result.tags,
        }
      }
    },
    async generateBundle(_opts, _bundle) {
      // Collect assets from all plugins and emit them through Rollup so they
      // appear in the Vite manifest and build log.
      const assets = await runBuildAssetsHooks(clarifyPlugins, ctx)
      for (const asset of assets) {
        this.emitFile({
          type: 'asset',
          fileName: asset.fileName,
          source: asset.source,
        })
      }
    },
    async closeBundle() {
      // ── Phase 1: Static page building ──
      const skipStaticPageBuilder = process.env.SKIP_CLARIFY_PAGE_BUILDER === '1'
        || process.env.SKIP_CLARIFY_PAGE_BUILDER === 'true'
      if (skipStaticPageBuilder) {
        await runBuildDoneHooks(clarifyPlugins, ctx)
        return
      }

      const outputDir = viteConfig.build.outDir
      const staticPageBuilderOutputDir = join(outputDir, '.ssr')
      let tempEntryPath: string | undefined

      try {
        tempEntryPath = createTempEntryFile(STATIC_PAGE_ENTRY_CODE)

        await buildSSRBundle(root, tempEntryPath, staticPageBuilderOutputDir, [
          {
            name: 'clarify:virtual-page-builder',
            resolveId(id) {
              if (id === VIRTUAL_CLIENT_ENTRY) return RESOLVED_CLIENT_ENTRY
              if (id === RESOLVED_CLIENT_ENTRY) return RESOLVED_CLIENT_ENTRY
              if (id === VIRTUAL_SERVER_ROUTES) return id
              if (id === VIRTUAL_OPENAPI) return id
              if (id === VIRTUAL_CONFIG) return id
              if (id === VIRTUAL_ROUTES) return id
              if (id === VIRTUAL_SLOTS) return id
              if (id === VIRTUAL_SLOT) return id
              if (virtualModules.has(stripVirtualPrefix(id))) return stripVirtualPrefix(id)
              const route = routes.find(r => r.virtualModuleId === id)
              if (route) return id
              return null
            },
            load: id => loadVirtualModule(id, virtualModules),
          },
        ])

        const staticPageRendererBundlePath = join(staticPageBuilderOutputDir, 'entry-server.js')
        await buildStaticPages(routes, runtimeContext, outputDir, staticPageRendererBundlePath, generateOptions.ssg.failOnError)
      } catch (err) {
        console.error('[clarify] Page builder failed during build-time SSR/static output generation:', err)
        if (generateOptions.ssg.failOnError) {
          throw err
        }
      } finally {
        if (tempEntryPath) {
          try {
            rmSync(tempEntryPath, { force: true })
          } catch {
            // ignore cleanup errors
          }
        }
      }

      await runBuildDoneHooks(clarifyPlugins, ctx)
    },
  }

  return [react(), tailwindcss(), clarifyCorePlugin].flat().filter(Boolean) as Plugin[]
}
