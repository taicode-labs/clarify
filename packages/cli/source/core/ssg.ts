import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

import { build } from 'vite'
import type { Plugin } from 'vite'

import type { ResolvedProjectConfig, ContentRoute } from '../types.js'

import { createClarifyRuntimeAliases } from './runtime-deps.js'
import { createClarifyTempDir } from './temp-dir.js'
import { escapeHtml } from './utils.js'

export function readIndexHtml(outputDirectory: string): string | undefined {
  const indexPath = join(outputDirectory, 'index.html')
  if (!existsSync(indexPath)) return undefined
  try {
    return readFileSync(indexPath, 'utf-8')
  } catch {
    return undefined
  }
}

function injectHtmlLocaleAttributes(html: string, projectConfig: ResolvedProjectConfig, route?: ContentRoute): string {
  const localeCode = route?.locale ?? projectConfig.i18n?.defaultLocale
  if (!localeCode) return html

  const localeConfig = projectConfig.i18n?.locales.find(locale => locale.code === localeCode)
  const dir = localeConfig?.dir

  return html.replace(/<html\b([^>]*)>/i, (_match, attributes: string) => {
    let nextAttributes = attributes
      .replace(/\s+lang=("[^"]*"|'[^']*'|[^\s>]*)/i, '')
      .replace(/\s+dir=("[^"]*"|'[^']*'|[^\s>]*)/i, '')

    nextAttributes = `${nextAttributes} lang="${escapeHtml(localeCode)}"`
    if (dir) nextAttributes = `${nextAttributes} dir="${escapeHtml(dir)}"`
    return `<html${nextAttributes}>`
  })
}

function routeTitle(projectConfig: ResolvedProjectConfig, route?: ContentRoute): string {
  const title = route?.title?.trim()
  if (!title || title === projectConfig.title) return projectConfig.title
  return `${title} - ${projectConfig.title}`
}

function setNamedMeta(html: string, name: string, content: string | undefined): string {
  const metaPattern = new RegExp(`<meta\\b(?=[^>]*\\bname=["']${name}["'])[^>]*>\\n?`, 'i')
  if (!content) return html.replace(metaPattern, '')

  const meta = `<meta name="${name}" content="${escapeHtml(content)}" />`
  if (metaPattern.test(html)) return html.replace(metaPattern, meta)
  return html.replace('</head>', `  ${meta}\n  </head>`)
}

export function injectSSRIntoTemplate(template: string, appHtml: string, projectConfig: ResolvedProjectConfig, route?: ContentRoute): string {
  let html = injectHtmlLocaleAttributes(template, projectConfig, route)

  // Replace <title>...</title>
  html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(routeTitle(projectConfig, route))}</title>`)

  html = setNamedMeta(html, 'description', route?.description ?? projectConfig.description)
  html = setNamedMeta(html, 'keywords', route?.keywords?.join(', '))

  // Replace <div id="root">...</div> with SSR rendered content
  html = html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${appHtml}</div>`)

  return html
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
}

// Exposed so SSG can inject per-page spec data for hydration.
export const ssrOpenApis = openApis;`

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

export async function renderSSGRoutes(routes: ContentRoute[], projectConfig: ResolvedProjectConfig, outputDirectory: string, ssrBundlePath: string, failOnError: boolean = true): Promise<void> {
  const { render, ssrOpenApis } = await import(pathToFileURL(ssrBundlePath).href)

  const template = readIndexHtml(outputDirectory)
  if (!template) {
    throw new Error(
      `[clarify] index.html not found in outputDirectory "${outputDirectory}". Make sure Vite build produces it.`
    )
  }

  for (const route of routes) {
    try {
      const appHtml = await render(route.path)
      let finalHtml = injectSSRIntoTemplate(template, appHtml, projectConfig, route)

      // Inject per-page OpenAPI spec data for hydration so the lazy page
      // module can read it synchronously via getElementById().
      if (route.specFileKey && ssrOpenApis?.[route.specFileKey]) {
        const specScript = `<script id="__openapi-spec-${route.specFileKey}" type="application/json">${JSON.stringify(ssrOpenApis[route.specFileKey])}</script>`
        finalHtml = finalHtml.replace('</head>', specScript + '\n  </head>')
      }

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
