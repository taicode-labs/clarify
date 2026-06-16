import { rmSync } from 'node:fs'
import { join } from 'node:path'

import mdxPlugin from '@mdx-js/rollup'
import type { Plugin, ResolvedConfig } from 'vite'

import { resolveProjectConfig, resolveGenerateOptions } from './config.js'
import { runHooks } from './hooks.js'
import { findMdxFiles, generateConfigModule, generateRoutesModule } from './routes.js'
import {
  SSR_ENTRY_CODE,
  createTempEntryFile,
  buildSSRBundle,
  renderSSGRoutes,
} from './ssg.js'
import type { ClarifyGenerateOptions, ClarifyHookContext, ClarifyPlugin, ResolvedProjectConfig, ResolvedGenerateOptions } from './types.js'

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

function loadVirtualModule(id: string, projectConfig: ResolvedProjectConfig, generateOptions: ResolvedGenerateOptions, routes: ReturnType<typeof findMdxFiles>,): string | null {
  if (id === VIRTUAL_CONFIG) {
    return generateConfigModule(projectConfig, generateOptions)
  }
  if (id === VIRTUAL_ROUTES) {
    return generateRoutesModule(routes, projectConfig.pages)
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

export function clarifyPlugin(options: ClarifyGenerateOptions = {}): Plugin[] {
  const root = process.cwd()
  const projectConfig = resolveProjectConfig(root)
  const generateOptions = resolveGenerateOptions(options)
  const contentRoot = join(root, generateOptions.rootDirectory)
  const routes = findMdxFiles(contentRoot)

  const clarifyPlugins: ClarifyPlugin[] = options.plugins ?? []
  const ctx: ClarifyHookContext = { projectConfig, generateOptions }
  let viteConfig: ResolvedConfig

  const mdx = mdxPlugin({
    include: options.include ?? ['**/*.mdx'],
    exclude: options.exclude,
  })

  const clarifyCorePlugin: Plugin = {
    name: 'clarify:core',
    config() {
      return {
        base: projectConfig.routePrefix,
        build: {
          outDir: generateOptions.outputDirectory,
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
      return loadVirtualModule(id, projectConfig, generateOptions, routes)
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

      const outputDir = viteConfig.build.outDir
      const ssrOutputDir = join(outputDir, '.ssr')
      let tempEntryPath: string | undefined

      try {
        tempEntryPath = createTempEntryFile(SSR_ENTRY_CODE)

        await buildSSRBundle(root, tempEntryPath, ssrOutputDir, [
          { name: 'clarify:virtual-ssg', resolveId: id => isVirtualId(id, routes) ? id : null, load: id => loadVirtualModule(id, projectConfig, generateOptions, routes) },
          mdx,
        ])

        const ssrBundlePath = join(ssrOutputDir, 'entry-server.js')
        await renderSSGRoutes(routes, projectConfig, outputDir, ssrBundlePath)
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
