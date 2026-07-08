import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

import { build } from 'vite'
import type { Plugin } from 'vite'

import type { ClarifyProjectContext, ContentRoute, ResolvedProjectConfig } from '../../types.js'

import { createClarifyRuntimeAliases } from './runtime-deps.js'
import { createClarifyTempDir } from '../project/temp-dir.js'
import { escapeHtml } from '../..//parsers/markdown/utils.js'

export function readIndexHtml(outputDirectory: string): string | undefined {
  const indexPath = join(outputDirectory, 'index.html')
  if (!existsSync(indexPath)) return undefined
  try {
    return readFileSync(indexPath, 'utf-8')
  } catch {
    return undefined
  }
}

function resolveProjectConfigFromContext(contextOrConfig: ClarifyProjectContext | ResolvedProjectConfig): ResolvedProjectConfig {
  return 'projectConfig' in contextOrConfig ? contextOrConfig.projectConfig : contextOrConfig
}

function injectHtmlLocaleAttributes(html: string, contextOrConfig: ClarifyProjectContext | ResolvedProjectConfig, route?: ContentRoute): string {
  const projectConfig = resolveProjectConfigFromContext(contextOrConfig)
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

function routeTitle(contextOrConfig: ClarifyProjectContext | ResolvedProjectConfig, route?: ContentRoute): string {
  const projectConfig = resolveProjectConfigFromContext(contextOrConfig)
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

function canonicalUrl(contextOrConfig: ClarifyProjectContext | ResolvedProjectConfig, route: ContentRoute): string | undefined {
  const projectConfig = resolveProjectConfigFromContext(contextOrConfig)
  if (!projectConfig.siteUrl || !route.alternates || !route.locale) return undefined
  const prefixedPath = route.alternates[route.locale]
  if (!prefixedPath || prefixedPath === route.path) return undefined

  const base = projectConfig.siteUrl.replace(/\/+$/, '')
  const prefix = (!projectConfig.routePrefix || projectConfig.routePrefix === '/')
    ? ''
    : `/${projectConfig.routePrefix.replace(/^\/+|\/+$/g, '')}`
  return `${base}${prefix}${prefixedPath}`
}

function injectCanonicalUrl(html: string, contextOrConfig: ClarifyProjectContext | ResolvedProjectConfig, route?: ContentRoute): string {
  const url = route ? canonicalUrl(contextOrConfig, route) : undefined
  // Remove any existing canonical link
  html = html.replace(/<link\b[^>]*\brel=["']canonical["'][^>]*\/?>\n?/gi, '')
  if (!url) return html
  return html.replace('</head>', `  <link rel="canonical" href="${escapeHtml(url)}" />\n  </head>`)
}

export function injectSSRIntoTemplate(template: string, appHtml: string, contextOrConfig: ClarifyProjectContext | ResolvedProjectConfig, route?: ContentRoute): string {
  const projectConfig = resolveProjectConfigFromContext(contextOrConfig)
  let html = injectHtmlLocaleAttributes(template, contextOrConfig, route)

  // Replace <title>...</title>
  html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(routeTitle(contextOrConfig, route))}</title>`)

  html = setNamedMeta(html, 'description', route?.description ?? projectConfig.description)
  html = setNamedMeta(html, 'keywords', route?.keywords?.join(', '))
  html = injectCanonicalUrl(html, contextOrConfig, route)

  // Replace <div id="root">...</div> with SSR rendered content
  // For bare alias routes (e.g., /path) in multilingual sites, mark the root div
  // with data-pagefind-ignore to prevent Pagefind from indexing duplicates
  const dataPagefindIgnore = route?.isBareAlias ? ' data-pagefind-ignore' : ''
  html = html.replace(/<div id="root">([\s\S]*?)<\/div>/, `<div id="root"${dataPagefindIgnore}>${appHtml}</div>`)

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
