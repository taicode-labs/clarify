import { join } from 'node:path'
import { rmSync } from 'node:fs'
import type { Plugin, ResolvedConfig } from 'vite'
import mdxPlugin from '@mdx-js/rollup'
import { resolveOptions } from './config.js'
import { findMdxFiles, generateConfigModule, generateRoutesModule } from './routes.js'
import { runHooks } from './hooks.js'
import {
  SSR_ENTRY_CODE,
  createTempEntryFile,
  buildSSRBundle,
  renderSSGRoutes,
} from './ssg.js'
import type { ClarifyPluginOptions, ClarifyHookContext, ClarifyPlugin } from './types.js'

export * from './types.js'

const VIRTUAL_CONFIG = 'virtual:clarify-config'
const VIRTUAL_ROUTES = 'virtual:clarify-routes'
const CLIENT_ENTRY_PATH = '/@clarify/entry-client'

const CLIENT_ENTRY_CODE = `import { render } from '@clarify/renderer';
import { routes, navigation } from '${VIRTUAL_ROUTES}';
import { config } from '${VIRTUAL_CONFIG}';
render({ config, routes, navigation });`

function isVirtualId(id: string, routes: ReturnType<typeof findMdxFiles>): boolean {
  if (id === VIRTUAL_CONFIG || id === VIRTUAL_ROUTES || id === CLIENT_ENTRY_PATH) {
    return true
  }
  return routes.some(r => r.virtualModuleId === id)
}

function loadVirtualModule(
  id: string,
  resolved: ReturnType<typeof resolveOptions>,
  routes: ReturnType<typeof findMdxFiles>
): string | null {
  if (id === VIRTUAL_CONFIG) {
    return generateConfigModule(resolved)
  }
  if (id === VIRTUAL_ROUTES) {
    return generateRoutesModule(routes)
  }
  if (id === CLIENT_ENTRY_PATH) {
    return CLIENT_ENTRY_CODE
  }
  const route = routes.find(r => r.virtualModuleId === id)
  if (route) {
    return `export { default } from '${route.filePath}';`
  }
  return null
}

export function clarifyPlugin(options: ClarifyPluginOptions = {}): Plugin[] {
  const root = process.cwd()
  const resolved = resolveOptions(root, options)
  const documentationRoot = join(root, resolved.documentationRoot)
  const routes = findMdxFiles(documentationRoot)

  const clarifyPlugins: ClarifyPlugin[] = options.plugins ?? []
  const ctx: ClarifyHookContext = { config: resolved }
  let viteConfig: ResolvedConfig

  const mdx = mdxPlugin({
    include: options.include ?? ['**/*.mdx'],
    exclude: options.exclude,
  })

  const clarifyCorePlugin: Plugin = {
    name: 'clarify:core',
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
    resolveId(id) {
      return isVirtualId(id, routes) ? id : null
    },
    load(id) {
      return loadVirtualModule(id, resolved, routes)
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return {
          html: html.replace(
            '</body>',
            `  <script type="module" src="${CLIENT_ENTRY_PATH}"></script>\n  </body>`
          ),
          tags: []
        }
      }
    },
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
        tempEntryPath = createTempEntryFile(SSR_ENTRY_CODE)

        await buildSSRBundle(root, tempEntryPath, ssrOutDir, [
          { name: 'clarify:virtual-ssg', resolveId: id => isVirtualId(id, routes) ? id : null, load: id => loadVirtualModule(id, resolved, routes) },
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
