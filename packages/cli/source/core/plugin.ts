import { rmSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'

import mdxPlugin from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'

import { rehypePlugins, remarkPlugins } from '../parsers/mdx.js'
import { buildLocalizedNavigationFromTabsConfig, buildNavigation, buildNavigationFromTabsConfig, findContentRoutes, localizedRoutePath, virtualModuleIdFromRef } from '../parsers/routes.js'
import { createContentArtifactsPlugin } from '../plugins/content-artifacts/index.js'
import { createHtmlShellPlugin } from '../plugins/html-shell/index.js'
import { createOpenAPIPlugin } from '../plugins/openapi/index.js'
import type { ClarifyHookContext, ClarifyPlugin, ContentRoute, NavigationTree, ResolvedClarifyI18nConfig } from '../types.js'

import { resolveProjectConfig } from './config.js'
import { runBuildDoneHooks, runDevConfigureServerHooks, runHooks } from './hooks.js'
import { resolveBuildOptions, type ClarifyBuildOptions } from './options.js'
import {
  SSR_ENTRY_CODE,
  createTempEntryFile,
  buildSSRBundle,
  renderSSGRoutes,
} from './ssg.js'
import { findClarifyConfigFile, loadClarifyConfig } from './user-config.js'
import {
  RESOLVED_CLIENT_ENTRY,
  VIRTUAL_CLIENT_ENTRY,
  VIRTUAL_CONFIG,
  VIRTUAL_OPENAPI_REGISTRY,
  VIRTUAL_ROUTES,
  buildVirtualModules,
  resolveVirtualId,
  stripVirtualPrefix,
  type VirtualModules,
} from './virtual-modules.js'

function loadVirtualModule(id: string, modules: VirtualModules): string | null {
  const bareId = stripVirtualPrefix(id)
  return modules.get(bareId) ?? modules.get(id) ?? null
}

export function clarifyPlugin(options: ClarifyBuildOptions = {}): Plugin[] {
  const root = resolve(options.projectRoot ?? process.cwd())
  let projectConfig = resolveProjectConfig(options)
  let generateOptions = resolveBuildOptions(options)
  const contentRoot = join(root, generateOptions.rootDirectory)
  const configFilePath = findClarifyConfigFile(root)
  let routes: ContentRoute[] = []

  const clarifyPlugins: ClarifyPlugin[] = [createOpenAPIPlugin(), createContentArtifactsPlugin(), createHtmlShellPlugin(), ...(options.plugins ?? [])]
  const ctx: ClarifyHookContext = { projectConfig, generateOptions, routes, navigation: [] }
  let viteConfig: ResolvedConfig
  let resolvedNavigation: NavigationTree = []
  let virtualModules: VirtualModules = new Map()

  async function reloadProjectConfig() {
    const userConfig = await loadClarifyConfig(root, { command: 'serve', mode: viteConfig.mode })
    const buildOptions: ClarifyBuildOptions = {
      ...userConfig,
      projectRoot: options.projectRoot,
      rootDirectory: options.rootDirectory,
      outputDirectory: options.outputDirectory,
    }
    projectConfig = resolveProjectConfig(buildOptions)
    generateOptions = resolveBuildOptions(buildOptions)
    ctx.projectConfig = projectConfig
    ctx.generateOptions = generateOptions
  }

  function withAlternates(route: ContentRoute, routeList: ContentRoute[], i18n: ResolvedClarifyI18nConfig): ContentRoute {
    const basePath = route.basePath ?? route.path
    const routeByLocaleAndBase = new Map(routeList.map(route => [`${route.locale ?? ''}:${route.basePath ?? route.path}`, route]))
    const alternates = Object.fromEntries(
      i18n.locales.flatMap((locale) => {
        const alternate = routeByLocaleAndBase.get(`${locale.code}:${basePath}`)
        return alternate ? [[locale.code, alternate.path]] : []
      })
    )
    return { ...route, alternates }
  }

  async function discoverRoutesForRoot(routeRoot: string, locale?: string): Promise<ContentRoute[]> {
    const discovered = await runHooks(clarifyPlugins, 'routes:discover', {
      contentRoot: routeRoot,
      locale,
      routes: findContentRoutes(routeRoot),
    }, ctx)
    return discovered.routes
  }

  async function discoverRoutes(): Promise<ContentRoute[]> {
    const i18n = projectConfig.i18n
    if (!i18n) return discoverRoutesForRoot(contentRoot)

    const localizedRoutes: ContentRoute[] = []
    for (const locale of i18n.locales) {
      const localeRoot = join(contentRoot, locale.code)
      const discovered = await discoverRoutesForRoot(localeRoot, locale.code)
      for (const route of discovered) {
        const basePath = route.basePath ?? route.path
        localizedRoutes.push({
          ...route,
          path: localizedRoutePath(basePath, locale.code, i18n),
          basePath,
          locale: locale.code,
          virtualModuleId: virtualModuleIdFromRef(relative(contentRoot, route.filePath)),
        })
      }
    }

    if (i18n.missing === 'fallback') {
      const routeByLocaleAndBase = new Map(localizedRoutes.map(route => [`${route.locale ?? ''}:${route.basePath ?? route.path}`, route]))
      const defaultRoutes = localizedRoutes.filter(route => route.locale === i18n.defaultLocale)
      for (const sourceRoute of defaultRoutes) {
        const basePath = sourceRoute.basePath ?? sourceRoute.path
        for (const locale of i18n.locales) {
          const key = `${locale.code}:${basePath}`
          if (routeByLocaleAndBase.has(key)) continue
          localizedRoutes.push({
            ...sourceRoute,
            path: localizedRoutePath(basePath, locale.code, i18n),
            locale: locale.code,
            isFallback: true,
          })
        }
      }
    }

    return localizedRoutes.map(route => withAlternates(route, localizedRoutes, i18n))
  }

  async function resolveRoutesAndSpecs() {
    routes = await discoverRoutes()
    routes = await runHooks(clarifyPlugins, 'routes:discovered', routes, ctx)

    const defaultNavigation = projectConfig.tabs
      ? projectConfig.i18n
        ? (buildLocalizedNavigationFromTabsConfig(routes, projectConfig.tabs, projectConfig.i18n) ?? {})
        : buildNavigationFromTabsConfig(routes, projectConfig.tabs)
      : buildNavigation(routes)
    const resolved = await runHooks(clarifyPlugins, 'routes:resolved', { routes, navigation: defaultNavigation }, ctx)
    routes = resolved.routes
    resolvedNavigation = resolved.navigation
    ctx.routes = routes
    ctx.navigation = resolvedNavigation
  }

  async function rebuildVirtualModules() {
    virtualModules = buildVirtualModules({
      projectConfig,
      generateOptions,
      routes,
      navigation: resolvedNavigation,
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

  const normalizedMdxContentPlugin: Plugin = {
    name: 'clarify:normalized-mdx-content',
    enforce: 'pre',
    transform(_code, id) {
      if (!/\.mdx?(?:\?|$)/.test(id)) return null
      const filePath = id.replace(/\?.*$/, '')
      const route = routes.find(route => route.kind === 'mdx' && route.filePath === filePath)
      if (!route || route.content === undefined) return null
      return { code: route.content, map: null }
    },
  }

  const mdx = mdxPlugin({
    include: ['**/*.{md,mdx}'],
    jsxImportSource: 'react',
    providerImportSource: '@clarify-labs/renderer',
    remarkPlugins,
    rehypePlugins,
  })

  const clarifyCorePlugin: Plugin = {
    name: 'clarify:core',
    async config() {
      await resolveRoutesAndSpecs()

      return {
        base: projectConfig.routePrefix,
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
    },
    async handleHotUpdate(ctx) {
      const changedFile = isAbsolute(ctx.file) ? ctx.file : join(root, ctx.file)
      if (configFilePath && changedFile === configFilePath) {
        await reloadProjectConfig()
        await refreshDevServer(ctx.server)
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
      if (id === VIRTUAL_OPENAPI_REGISTRY || id === resolveVirtualId(VIRTUAL_OPENAPI_REGISTRY)) return resolveVirtualId(VIRTUAL_OPENAPI_REGISTRY)
      const route = routes.find(r => r.virtualModuleId === id || r.virtualModuleId === stripVirtualPrefix(id))
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
    async closeBundle() {
      // ── Phase 1: Static HTML Generation ──
      if (process.env.SKIP_CLARIFY_SSG) {
        await runBuildDoneHooks(clarifyPlugins, ctx)
        return
      }

      const outputDir = viteConfig.build.outDir
      const ssrOutputDir = join(outputDir, '.ssr')
      let tempEntryPath: string | undefined

      try {
        tempEntryPath = createTempEntryFile(SSR_ENTRY_CODE)

        await buildSSRBundle(root, tempEntryPath, ssrOutputDir, [
          {
            name: 'clarify:virtual-ssg',
            resolveId(id) {
              if (id === VIRTUAL_CLIENT_ENTRY) return RESOLVED_CLIENT_ENTRY
              if (id === RESOLVED_CLIENT_ENTRY) return RESOLVED_CLIENT_ENTRY
              if (id === VIRTUAL_CONFIG) return id
              if (id === VIRTUAL_ROUTES) return id
              if (id === VIRTUAL_OPENAPI_REGISTRY) return id
              const route = routes.find(r => r.virtualModuleId === id)
              if (route) return id
              return null
            },
            load: id => loadVirtualModule(id, virtualModules),
          },
          normalizedMdxContentPlugin,
          mdx,
        ])

        const ssrBundlePath = join(ssrOutputDir, 'entry-server.js')
        await renderSSGRoutes(routes, projectConfig, outputDir, ssrBundlePath, generateOptions.ssg.failOnError)
      } catch (err) {
        console.error('[clarify] SSG failed:', err)
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

  return [react(), tailwindcss(), normalizedMdxContentPlugin, clarifyCorePlugin, mdx].flat().filter(Boolean) as Plugin[]
}

export type { Plugin } from 'vite'
