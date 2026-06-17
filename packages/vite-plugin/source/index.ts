import { rmSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import mdxPlugin from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin, ResolvedConfig } from 'vite'

import { resolveProjectConfig, resolveGenerateOptions } from './config.js'
import { runHooks } from './hooks.js'
import { findContentRoutes, generateConfigModule, generateRoutesModule } from './routes.js'
import {
  SSR_ENTRY_CODE,
  createTempEntryFile,
  buildSSRBundle,
  renderSSGRoutes,
} from './ssg.js'
import type { ClarifyGenerateOptions, ClarifyHookContext, ClarifyPlugin, ContentRoute, ResolvedProjectConfig, ResolvedGenerateOptions } from './types.js'

export * from './types.js'

const VIRTUAL_CONFIG = 'virtual:clarify-config'
const VIRTUAL_ROUTES = 'virtual:clarify-routes'
const VIRTUAL_CLIENT_ENTRY = 'virtual:clarify-entry-client'
const RESOLVED_CLIENT_ENTRY = '\0' + VIRTUAL_CLIENT_ENTRY

// Vite recommends prefixing resolved virtual module ids with \0 to prevent
// other plugins from trying to process them as file paths.
function resolveVirtualId(id: string): string {
  return '\0' + id
}

// The client entry imports renderer's source CSS via the package's "./style.css"
// export. This path is resolved by Node/Vite via package.json exports to
// @clarify/renderer/source/styles.css, which contains `@import "tailwindcss"`.
// Importing it here ensures @tailwindcss/vite (configured in the consumer's
// Vite config) processes it through the full Tailwind pipeline (theme,
// content scanning) — instead of using a pre-built CSS file that would lose
// those capabilities.
const CLIENT_ENTRY_CODE = `
import '@clarify/renderer/style.css';
import { render } from '@clarify/renderer';
import { routes, navigation } from '${VIRTUAL_ROUTES}';
import { config } from '${VIRTUAL_CONFIG}';
render({ config, routes, navigation });`

function generateOpenAPIModule(filePath: string): string {
  const spec = readFileSync(filePath, 'utf-8')
  return `import { createElement } from 'react';
import { OpenApiPage } from '@clarify/renderer';
const spec = ${spec};
export default function OpenApiRoutePage() {
  return createElement(OpenApiPage, { spec });
}`
}

function stripVirtualPrefix(id: string): string {
  return id.startsWith('\0') ? id.slice(1) : id
}

function loadVirtualModule(
  id: string,
  projectConfig: ResolvedProjectConfig,
  generateOptions: ResolvedGenerateOptions,
  routes: ContentRoute[],
): string | null {
  const bareId = stripVirtualPrefix(id)
  if (bareId === VIRTUAL_CONFIG) {
    return generateConfigModule(projectConfig, generateOptions)
  }
  if (bareId === VIRTUAL_ROUTES) {
    return generateRoutesModule(routes, projectConfig.pages)
  }
  if (bareId === VIRTUAL_CLIENT_ENTRY || bareId === RESOLVED_CLIENT_ENTRY) {
    return CLIENT_ENTRY_CODE
  }
  const route = routes.find(r => r.virtualModuleId === bareId)
  if (!route) return null
  if (route.kind === 'openapi') {
    return generateOpenAPIModule(route.filePath)
  }
  return `export { default } from '${route.filePath}';`
}

export function clarifyPlugin(options: ClarifyGenerateOptions = {}): Plugin[] {
  const root = process.cwd()
  const projectConfig = resolveProjectConfig(root)
  const generateOptions = resolveGenerateOptions(options)
  const contentRoot = join(root, generateOptions.rootDirectory)
  const routes = findContentRoutes(contentRoot)

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
    resolveId(id) {
      if (id === VIRTUAL_CLIENT_ENTRY || id === RESOLVED_CLIENT_ENTRY) return RESOLVED_CLIENT_ENTRY
      if (id === VIRTUAL_CONFIG || id === resolveVirtualId(VIRTUAL_CONFIG)) return resolveVirtualId(VIRTUAL_CONFIG)
      if (id === VIRTUAL_ROUTES || id === resolveVirtualId(VIRTUAL_ROUTES)) return resolveVirtualId(VIRTUAL_ROUTES)
      const route = routes.find(r => r.virtualModuleId === id || r.virtualModuleId === stripVirtualPrefix(id))
      if (route) return resolveVirtualId(route.virtualModuleId)
      return null
    },
    load(id) {
      return loadVirtualModule(id, projectConfig, generateOptions, routes)
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
        await runHooks(clarifyPlugins, 'build:done', undefined as any, ctx)
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
              const route = routes.find(r => r.virtualModuleId === id)
              if (route) return id
              return null
            },
            load: id => loadVirtualModule(id, projectConfig, generateOptions, routes),
          },
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

  return [react(), tailwindcss(), clarifyCorePlugin, mdx].flat().filter(Boolean) as Plugin[]
}

export type { Plugin } from 'vite'
