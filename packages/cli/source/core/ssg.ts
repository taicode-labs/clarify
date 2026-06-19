import { existsSync, readFileSync, mkdirSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

import { build } from 'vite'
import type { Plugin } from 'vite'

import type { ResolvedProjectConfig, ContentRoute } from '../types.js'

import { createClarifyRuntimeAliases } from './runtime-deps.js'
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

export function injectSSRIntoTemplate(template: string, appHtml: string, projectConfig: ResolvedProjectConfig, route?: ContentRoute): string {
  let html = injectHtmlLocaleAttributes(template, projectConfig, route)

  // Replace <title>...</title>
  html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(projectConfig.title)}</title>`)

  // Inject description meta if not present and description is set
  if (projectConfig.description && !html.includes('name="description"')) {
    const descriptionMeta = `<meta name="description" content="${escapeHtml(projectConfig.description)}" />`
    html = html.replace('</head>', `  ${descriptionMeta}\n  </head>`)
  }

  // Replace <div id="root">...</div> with SSR rendered content
  html = html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${appHtml}</div>`)

  return html
}

export const SSR_ENTRY_CODE = `import { renderToHTML } from '@clarify-labs/renderer/server';
import { routes, navigation } from 'virtual:clarify-routes/server';
import { config } from 'virtual:clarify-config';
import { openApis } from 'virtual:clarify-openapi-registry';

export function render(url) {
  return renderToHTML({ config, routes, navigation, openApis, url });
}`

export function createTempEntryFile(content: string): string {
  const tempDir = mkdtempSync(join(tmpdir(), 'clarify-ssr-'))
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
  const { render } = await import(pathToFileURL(ssrBundlePath).href)

  const template = readIndexHtml(outputDirectory)
  if (!template) {
    throw new Error(
      `[clarify] index.html not found in outputDirectory "${outputDirectory}". Make sure Vite build produces it.`
    )
  }

  for (const route of routes) {
    try {
      const appHtml = render(route.path)
      const finalHtml = injectSSRIntoTemplate(template, appHtml, projectConfig, route)

      const outFile = join(outputDirectory, route.path, 'index.html')
      mkdirSync(dirname(outFile), { recursive: true })
      writeFileSync(outFile, finalHtml, 'utf-8')
    } catch (err) {
      console.error(`[clarify] Failed to render route "${route.path}":`, err)
      if (failOnError) {
        throw err
      }
    }
  }
}
