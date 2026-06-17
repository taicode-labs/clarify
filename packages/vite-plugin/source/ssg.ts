import { existsSync, readFileSync, mkdirSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

import { build } from 'vite'
import type { Plugin } from 'vite'

import type { ResolvedProjectConfig, ContentRoute } from './types.js'
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

export function injectSSRIntoTemplate(template: string, appHtml: string, projectConfig: ResolvedProjectConfig): string {
  let html = template

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

export const SSR_ENTRY_CODE = `import { renderToHTML } from '@clarify/renderer/server';
import { routes, navigation } from 'virtual:clarify-routes';
import { config } from 'virtual:clarify-config';

export function render(url) {
  return renderToHTML({ config, routes, navigation, url });
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
    plugins,
    build: {
      ssr: ssrEntry,
      outDir: ssrOutDir,
      emptyOutDir: true,
      rollupOptions: {
        input: ssrEntry,
        external: [
          'react',
          'react-dom',
          'react-dom/server',
          'react-router-dom',
          '@clarify/renderer',
          '@clarify/renderer/server',
        ],
      },
    },
  })
}

export async function renderSSGRoutes(routes: ContentRoute[], projectConfig: ResolvedProjectConfig, outputDirectory: string, ssrBundlePath: string): Promise<void> {
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
      const finalHtml = injectSSRIntoTemplate(template, appHtml, projectConfig)

      const outFile = join(outputDirectory, route.path, 'index.html')
      mkdirSync(dirname(outFile), { recursive: true })
      writeFileSync(outFile, finalHtml, 'utf-8')
    } catch (err) {
      console.error(`[clarify] Failed to render route "${route.path}":`, err)
    }
  }
}
