import { createReadStream, existsSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'

import type { ViteDevServer } from 'vite'

import { createClarifyTempDir, removeClarifyTempDir } from '../../core/project/temp-dir.js'
import { toPagefindLanguage } from './search-language.js'
import type { ClarifyHookContext, ClarifyPlugin, ContentRoute } from '../../types.js'

type PagefindModule = typeof import('pagefind')

type GeneratePagefindIndexOptions = {
  outputRoot: string
  sourceRoot?: string
}

const pagefindContentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
}

function assertNoPagefindErrors(action: string, errors: string[] | undefined): void {
  if (!errors?.length) return
  throw new Error(`[clarify] Pagefind ${action} failed:\n${errors.join('\n')}`)
}

async function generatePagefindIndex(options: GeneratePagefindIndexOptions, pagefind?: PagefindModule): Promise<number> {
  const runtime = pagefind ?? (await import('pagefind') as PagefindModule)
  const { errors, index } = await runtime.createIndex({
    excludeSelectors: [
      '[data-pagefind-ignore]',
      'script',
      'style',
      'svg',
    ],
    includeCharacters: '._-/#:@',
    keepIndexUrl: false,
    verbose: false,
    writePlayground: false,
  })

  assertNoPagefindErrors('createIndex', errors)
  if (!index) throw new Error('[clarify] Pagefind did not create an index.')

  try {
    const addResult = await index.addDirectory({ path: options.sourceRoot ?? options.outputRoot, glob: '**/*.html' })
    assertNoPagefindErrors('addDirectory', addResult.errors)

    const writeResult = await index.writeFiles({ outputPath: join(options.outputRoot, 'pagefind') })
    assertNoPagefindErrors('writeFiles', writeResult.errors)

    return addResult.page_count
  } finally {
    await index.deleteIndex()
    if (!pagefind) {
      await runtime.close()
    }
  }
}

function routeSearchContent(route: ContentRoute): string {
  return [
    route.title,
    route.description,
    route.keywords?.join(' '),
    route.sections?.map(section => section.title).join(' '),
    route.content,
  ].filter(Boolean).join('\n\n')
}

async function generateDevSearchIndex(ctx: ClarifyHookContext, root: string, pagefind: PagefindModule): Promise<void> {
  const { errors, index } = await pagefind.createIndex({
    includeCharacters: '._-/#:@',
    keepIndexUrl: false,
    verbose: false,
    writePlayground: false,
  })

  assertNoPagefindErrors('createIndex', errors)
  if (!index) throw new Error('[clarify] Pagefind did not create an index.')

  try {
    let pageCount = 0
    for (const route of ctx.routes) {
      // Skip bare alias routes (e.g., /path) to avoid indexing duplicates in multilingual sites
      // Only index the full path with locale prefix (e.g., /locale/path)
      if (route.isBareAlias) continue
      
      const content = routeSearchContent(route)
      if (!content.trim()) continue
      const result = await index.addCustomRecord({
        url: route.path,
        content,
        language: toPagefindLanguage(route.locale ?? ctx.projectConfig.i18n?.defaultLocale),
        meta: {
          title: route.title,
        },
      })
      assertNoPagefindErrors(`addCustomRecord ${route.path}`, result.errors)
      pageCount += 1
    }

    const writeResult = await index.writeFiles({ outputPath: join(root, 'pagefind') })
    assertNoPagefindErrors('writeFiles', writeResult.errors)
    console.log(`[clarify] Dev search index generated for ${pageCount} pages.`)
  } finally {
    await index.deleteIndex()
  }
}

function normalizeDevPagefindPath(rawUrl: string | undefined, routePrefix: string): string | undefined {
  const pathname = rawUrl?.split('?')[0]
  if (!pathname) return undefined

  const normalizedPrefix = routePrefix && routePrefix !== '/' ? `/${routePrefix.replace(/^\/+|\/+$/g, '')}` : ''
  const pagefindPath = normalizedPrefix && pathname.startsWith(`${normalizedPrefix}/pagefind/`)
    ? pathname.slice(normalizedPrefix.length)
    : pathname

  return pagefindPath.startsWith('/pagefind/') ? pagefindPath : undefined
}

function serveDevPagefind(server: ViteDevServer, getRoot: () => string | undefined, ctx: ClarifyHookContext): void {
  server.middlewares.use((req, res, next) => {
    const root = getRoot()
    const pagefindPath = normalizeDevPagefindPath(req.url, ctx.projectConfig.routePrefix)
    if (!root || !pagefindPath) {
      next()
      return
    }

    const filePath = join(root, pagefindPath)
    const relativePath = relative(root, filePath)
    if (relativePath.startsWith('..') || relativePath === '' || !existsSync(filePath)) {
      next()
      return
    }

    const contentType = pagefindContentTypes[extname(filePath)] ?? 'application/octet-stream'
    res.setHeader('Content-Type', contentType)
    createReadStream(filePath).pipe(res)
  })
}

export function createSearchIndexPlugin(): ClarifyPlugin {
  return {
    name: 'clarify:search-index',
    hooks: {
      async 'dev:configureServer'(server, ctx) {
        const pagefind = await import('pagefind') as PagefindModule
        let currentRoot: string | undefined
        const staleRoots = new Set<string>()

        const replaceDevIndex = async () => {
          const nextRoot = createClarifyTempDir('pagefind')
          await generateDevSearchIndex(ctx, nextRoot, pagefind)
          const previousRoot = currentRoot
          currentRoot = nextRoot
          if (previousRoot) {
            staleRoots.add(previousRoot)
            setTimeout(() => {
              staleRoots.delete(previousRoot)
              removeClarifyTempDir(previousRoot)
            }, 30_000).unref?.()
          }
        }

        serveDevPagefind(server, () => currentRoot, ctx)
        await replaceDevIndex()

        let regenerateTimer: ReturnType<typeof setTimeout> | undefined
        const regenerate = (filePath: string) => {
          if (!/\.(md|mdx|json|ya?ml)$/i.test(filePath)) return
          if (regenerateTimer) clearTimeout(regenerateTimer)
          regenerateTimer = setTimeout(() => {
            void replaceDevIndex().catch((err: unknown) => {
              console.error('[clarify] Failed to regenerate dev search index:', err)
            })
          }, 100)
        }

        server.watcher.on('add', regenerate)
        server.watcher.on('change', regenerate)
        server.watcher.on('unlink', regenerate)

        server.httpServer?.once('close', () => {
          if (regenerateTimer) clearTimeout(regenerateTimer)
          removeClarifyTempDir(currentRoot)
          for (const staleRoot of staleRoots) removeClarifyTempDir(staleRoot)
          void pagefind.close().catch(() => undefined)
        })
      },
      async 'build:done'(ctx) {
        const outputDirectory = ctx.generateOptions.outputDirectory
        if (!outputDirectory) return

        const outputRoot = resolve(ctx.generateOptions.projectRoot, outputDirectory)
        const pageCount = await generatePagefindIndex({ outputRoot })
        console.log(`[clarify] Search index generated for ${pageCount} pages.`)
      },
    },
  }
}
