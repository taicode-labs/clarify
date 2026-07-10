import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

import { build } from 'vite'
import type { Plugin } from 'vite'

import type { ClarifyProjectContext, ContentRoute, ResolvedProjectConfig } from '../../types.js'
import { createClarifyTempDir } from '../project/temp-dir.js'

import { injectSSRIntoTemplate } from './html-template.js'
import { createClarifyRuntimeAliases } from './runtime-deps.js'

// Re-export the template helpers so existing callers that imported them from
// `ssg.ts` keep working. The implementations live in `html-template.ts`.
export { injectSSRIntoTemplate } from './html-template.js'

export function readIndexHtml(outputDirectory: string): string | undefined {
  const indexPath = join(outputDirectory, 'index.html')
  if (!existsSync(indexPath)) return undefined
  try {
    return readFileSync(indexPath, 'utf-8')
  } catch {
    return undefined
  }
}

export function isNotFoundRoute(route: ContentRoute): boolean {
  return (route.basePath ?? route.path) === '/404'
}

export function routeOutputFiles(outputDirectory: string, route: ContentRoute): string[] {
  const files = [join(outputDirectory, route.path, 'index.html')]
  if (isNotFoundRoute(route) && (!route.locale || route.path === '/404')) {
    files.push(join(outputDirectory, '404.html'))
  }
  return files
}

export const SSR_ENTRY_CODE = `import { renderToHTML } from '@clarify-labs/renderer/server';
import { routes, navigation } from 'virtual:clarify/routes/server';
import { config } from 'virtual:clarify/config';
import { openApis } from 'virtual:clarify/openapi';
import { runtimeSlots } from 'virtual:clarify/slots';

export async function render(url) {
  // Pre-resolve every slot component factory so renderToString can use
  // them synchronously (renderToString has no Suspense support).
  const entries = Object.values(runtimeSlots).flat()
  await Promise.all(entries.map(async (entry) => {
    const mod = await entry.component()
    entry._resolved = mod.default
  }))
  return renderToHTML({ config, routes, navigation, openApis, runtimeSlots, url, themeEditor: config.theme.editor });
}`

export function createTempEntryFile(content: string): string {
  const tempDir = createClarifyTempDir('ssr')
  const entryPath = join(tempDir, 'entry-server.ts')
  writeFileSync(entryPath, content, 'utf-8')
  return entryPath
}

export async function buildSSRBundle(root: string, ssrEntry: string, ssrOutDir: string, plugins: Plugin[]): Promise<void> {
  await build({
    root,
    configFile: false,
    resolve: {
      alias: createClarifyRuntimeAliases(),
    },
    ssr: {
      noExternal: true,
    },
    plugins,
    build: {
      ssr: ssrEntry,
      outDir: ssrOutDir,
      emptyOutDir: true,
      rolldownOptions: {
        input: ssrEntry,
        checks: {
          pluginTimings: false,
        },
      },
    },
  })
}

export async function renderSSGRoutes(routes: ContentRoute[], contextOrConfig: ClarifyProjectContext | ResolvedProjectConfig, outputDirectory: string, ssrBundlePath: string, failOnError: boolean = true): Promise<void> {
  const { render } = await import(pathToFileURL(ssrBundlePath).href)

  const template = readIndexHtml(outputDirectory)
  if (!template) {
    throw new Error(
      `[clarify] index.html not found in outputDirectory "${outputDirectory}". Make sure Vite build produces it.`
    )
  }

  for (const route of routes) {
    try {
      const appHtml = await render(route.path)
      const finalHtml = injectSSRIntoTemplate(template, appHtml, contextOrConfig, route)

      for (const outFile of routeOutputFiles(outputDirectory, route)) {
        mkdirSync(dirname(outFile), { recursive: true })
        writeFileSync(outFile, finalHtml, 'utf-8')
      }
    } catch (err) {
      console.error(`[clarify] Failed to render route "${route.path}":`, err)
      if (failOnError) {
        throw err
      }
    }
  }
}
