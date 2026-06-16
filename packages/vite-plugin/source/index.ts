import { join } from 'node:path'
import { rmSync } from 'node:fs'
import type { Plugin, ResolvedConfig } from 'vite'
import mdxPlugin from '@mdx-js/rollup'
import { resolveOptions } from './config.js'
import { findMdxFiles, generateConfigModule, generateRoutesModule } from './routes.js'
import { runHooks } from './hooks.js'
import {
  generateSSREntryCode,
  createTempEntryFile,
  buildSSRBundle,
  renderSSGRoutes,
} from './ssg.js'
import type { ClarifyPluginOptions, ClarifyHookContext, ClarifyPlugin } from './types.js'

export * from './types.js'

const VIRTUAL_CONFIG = 'virtual:clarify-config'
const VIRTUAL_ROUTES = 'virtual:clarify-routes'

function createVirtualModulePlugin(
  resolved: ReturnType<typeof resolveOptions>,
  routes: ReturnType<typeof findMdxFiles>,
  pageMap: Map<string, string>
): Plugin {
  return {
    name: 'clarify:virtual',
    enforce: 'pre',
    resolveId(id) {
      if (id === VIRTUAL_CONFIG || id === VIRTUAL_ROUTES) {
        return id
      }
      if (pageMap.has(id)) {
        return id
      }
      return null
    },
    async load(id) {
      if (id === VIRTUAL_CONFIG) {
        return generateConfigModule(resolved)
      }
      if (id === VIRTUAL_ROUTES) {
        // TODO: invoke hooks 'routes:resolved' here in future
        return generateRoutesModule(routes)
      }
      const filePath = pageMap.get(id)
      if (filePath) {
        // TODO: invoke hooks 'page:transform' here in future
        return `export { default } from '${filePath}';`
      }
      return null
    },
  }
}

export function clarifyPlugin(options: ClarifyPluginOptions = {}): Plugin[] {
  const root = process.cwd()
  const resolved = resolveOptions(root, options)
  const documentationRoot = join(root, resolved.documentationRoot)
  const routes = findMdxFiles(documentationRoot)

  // Track which virtual page modules exist
  const pageMap = new Map<string, string>()
  for (const route of routes) {
    pageMap.set(route.virtualModuleId, route.filePath)
  }

  const clarifyPlugins: ClarifyPlugin[] = options.plugins ?? []
  const ctx: ClarifyHookContext = { config: resolved }
  let viteConfig: ResolvedConfig

  const virtualModulePlugin = createVirtualModulePlugin(resolved, routes, pageMap)

  // MDX processing via @mdx-js/rollup
  const mdx = mdxPlugin({
    include: options.include ?? ['**/*.mdx'],
    exclude: options.exclude,
  })

  const clarifyCorePlugin: Plugin = {
    name: 'clarify:core',
    enforce: 'pre',
    config() {
      return {
        base: resolved.routeBase,
        build: {
          outDir: resolved.outputDirectory,
          manifest: true,
        },
      }
    },
    configResolved(config) {
      viteConfig = config
    },
    resolveId: virtualModulePlugin.resolveId,
    load: virtualModulePlugin.load,
    async closeBundle() {
      // ── Phase 1: Static HTML Generation ──
      if (process.env.SKIP_CLARIFY_SSG) {
        await runHooks(clarifyPlugins, 'build:done', undefined as any, ctx)
        return
      }

      const outDir = viteConfig.build.outDir
      const ssrOutDir = join(outDir, '.ssr')
      let tempEntryPath: string | undefined

      try {
        const entryCode = generateSSREntryCode()
        tempEntryPath = createTempEntryFile(entryCode)

        await buildSSRBundle(root, tempEntryPath, ssrOutDir, [
          virtualModulePlugin,
          mdx,
        ])

        const ssrBundlePath = join(ssrOutDir, 'entry-server.js')
        await renderSSGRoutes(routes, resolved, outDir, ssrBundlePath)
      } catch (err) {
        console.error('[clarify] SSG failed:', err)
      } finally {
        if (tempEntryPath) {
          try {
            rmSync(tempEntryPath, { force: true })
          } catch {
            // ignore cleanup errors
          }
        }
      }

      await runHooks(clarifyPlugins, 'build:done', undefined as any, ctx)
    },
  }

  return [clarifyCorePlugin, mdx]
}

export type { Plugin } from 'vite'
