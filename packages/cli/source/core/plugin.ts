import { rmSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'

import mdxPlugin from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'

import { rehypePlugins, remarkPlugins } from '../content/mdx.js'
import { createLlmsTxt, enrichRoutesWithRawContent, readRawContent, writeLlmsTxt, writeRawContentFiles } from '../content/raw-content.js'
import { buildLocalizedNavigation, buildNavigation, buildNavigationFromConfig, extractOpenAPISections, findLocalizedContentRoutes, readOpenAPISpec } from '../content/routes.js'
import type { ClarifyHookContext, ClarifyPlugin, NavigationTree, OpenAPISpec } from '../types.js'

import { resolveProjectConfig } from './config.js'
import { runBuildDoneHooks, runHooks } from './hooks.js'
import { resolveBuildOptions, type ClarifyBuildOptions } from './options.js'
import {
  SSR_ENTRY_CODE,
  createTempEntryFile,
  buildSSRBundle,
  renderSSGRoutes,
} from './ssg.js'
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
  const projectConfig = resolveProjectConfig(root)
  const generateOptions = resolveBuildOptions(options)
  const contentRoot = join(root, generateOptions.rootDirectory)
  let routes = findLocalizedContentRoutes(contentRoot, projectConfig.i18n)

  // Collect OpenAPI specs keyed by virtual module ID for runtime embedding.
  // Specs are populated asynchronously before Vite resolves config.
  const openApis: Record<string, OpenAPISpec> = {}

  const clarifyPlugins: ClarifyPlugin[] = options.plugins ?? []
  const ctx: ClarifyHookContext = { projectConfig, generateOptions }
  let viteConfig: ResolvedConfig
  let resolvedNavigation: NavigationTree = []
  let virtualModules: VirtualModules = new Map()

  async function resolveRoutesAndSpecs() {
    routes = findLocalizedContentRoutes(contentRoot, projectConfig.i18n)
    enrichRoutesWithRawContent(routes)
    for (const key of Object.keys(openApis)) delete openApis[key]

    for (const route of routes.filter(r => r.kind === 'openapi')) {
      const spec = await readOpenAPISpec(route.filePath)
      if (spec) {
        openApis[route.virtualModuleId] = spec
        route.title = spec.info?.title ?? route.title
        route.sections = extractOpenAPISections(spec)
      } else {
        throw new Error(`[clarify] Failed to parse OpenAPI spec: ${route.filePath}`)
      }
    }

    const defaultNavigation = projectConfig.i18n
      ? (buildLocalizedNavigation(routes, projectConfig.pages, projectConfig.i18n) ?? {})
      : projectConfig.pages && projectConfig.pages !== 'FileTree'
        ? buildNavigationFromConfig(routes, projectConfig.pages)
        : buildNavigation(routes)
    const resolved = await runHooks(clarifyPlugins, 'routes:resolved', { routes, navigation: defaultNavigation }, ctx)
    routes = resolved.routes
    enrichRoutesWithRawContent(routes)
    resolvedNavigation = resolved.navigation
  }

  async function rebuildVirtualModules() {
    virtualModules = buildVirtualModules({
      projectConfig,
      generateOptions,
      routes,
      navigation: resolvedNavigation,
      openApis,
    })
    virtualModules = await runHooks(clarifyPlugins, 'modules:before', virtualModules, ctx)
  }

  function invalidateVirtualModules(server: ViteDevServer) {
    for (const id of virtualModules.keys()) {
      const moduleNode = server.moduleGraph.getModuleById(resolveVirtualId(id))
      if (moduleNode) server.moduleGraph.invalidateModule(moduleNode)
    }
  }

  const mdx = mdxPlugin({
    include: ['**/*.{md,mdx}'],
    jsxImportSource: 'react',
    providerImportSource: '@clarify/renderer',
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
      const relativeContentFile = relative(contentRoot, changedFile)
      const isContentFile = relativeContentFile && !relativeContentFile.startsWith('..') && !isAbsolute(relativeContentFile)
      const isClarifyContent = isContentFile && (/\.mdx?$/.test(changedFile) || /\.openapi\.(json|yaml|yml)$/.test(changedFile))
      if (!isClarifyContent) return

      await resolveRoutesAndSpecs()
      await rebuildVirtualModules()
      invalidateVirtualModules(ctx.server)
      ctx.server.ws.send({ type: 'full-reload' })
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
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestPath = req.url?.split('?')[0] ?? ''
        const basePath = projectConfig.routePrefix === '/' ? '' : `/${projectConfig.routePrefix.replace(/^\/+|\/+$/g, '')}`
        const contentPath = basePath && requestPath.startsWith(basePath)
          ? requestPath.slice(basePath.length) || '/'
          : requestPath

        if (contentPath === '/llms.txt') {
          res.statusCode = 200
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(createLlmsTxt(routes, projectConfig))
          return
        }

        const route = routes.find(route => route.rawContentUrl === contentPath)
        if (!route) {
          next()
          return
        }

        const contentType = route.kind === 'openapi' && /\.ya?ml$/i.test(route.rawContentUrl ?? '')
          ? 'text/yaml; charset=utf-8'
          : route.kind === 'openapi'
            ? 'application/json; charset=utf-8'
            : 'text/markdown; charset=utf-8'
        res.statusCode = 200
        res.setHeader('Content-Type', contentType)
        res.end(readRawContent(route))
      })
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        // In dev mode, use /@id/ prefix so Vite dev server can resolve the virtual module.
        // In build mode, use the bare virtual: ID so Vite's HTML build pipeline resolves it via resolveId.
        const src = ctx.server
          ? `/@id/${VIRTUAL_CLIENT_ENTRY}`
          : VIRTUAL_CLIENT_ENTRY
        return {
          html,
          tags: [
            {
              tag: 'script',
              attrs: { type: 'module', src },
              injectTo: 'body',
            },
          ],
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
          mdx,
        ])

        const ssrBundlePath = join(ssrOutputDir, 'entry-server.js')
        await renderSSGRoutes(routes, projectConfig, outputDir, ssrBundlePath, generateOptions.ssg.failOnError)
        writeRawContentFiles(routes, outputDir)
        writeLlmsTxt(routes, projectConfig, outputDir)
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

  return [react(), tailwindcss(), clarifyCorePlugin, mdx].flat().filter(Boolean) as Plugin[]
}

export type { Plugin } from 'vite'
