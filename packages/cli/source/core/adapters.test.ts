import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { HmrContext, ModuleNode, Plugin, ViteDevServer } from 'vite'
import { describe, expect, it } from 'vitest'

import type { MarkdownContentRoute } from '../types.js'

import { createContentCompileTransform, createViteAdapter } from './adapters.js'
import { ClarifyEngine } from './engine/engine.js'
import { contentVirtualModuleId } from './runtime/module-ids.js'
import { resolveVirtualId, VIRTUAL_ROUTES } from './runtime/virtual-modules.js'

function createServer(sends: unknown[] = [], modules = new Map<string, ModuleNode>()): ViteDevServer {
  return {
    watcher: {
      add: () => undefined,
      on: () => undefined,
    },
    moduleGraph: {
      getModuleById: (id: string) => modules.get(id),
      invalidateModule: () => undefined,
    },
    ws: {
      send: (message: unknown) => {
        sends.push(message)
      },
    },
    middlewares: {
      use: () => undefined,
    },
  } as unknown as ViteDevServer
}

type RouteFixture = Partial<Omit<MarkdownContentRoute, 'kind' | 'meta' | 'module' | 'source'>> & {
  title?: string
  filePath?: string
  pageVirtualModuleId?: string
  content?: string
}

function createRoute(overrides: RouteFixture = {}): MarkdownContentRoute {
  const { title, filePath, pageVirtualModuleId, content, ...rest } = overrides
  const sourceFilePath = filePath ?? '/site/source/guide.md'
  return {
    path: '/guide',
    kind: 'markdown+jsx',
    meta: { title: title ?? 'Guide' },
    module: {
      pageVirtualModuleId: pageVirtualModuleId ?? 'virtual:clarify-page/guide',
      contentVirtualModuleId: contentVirtualModuleId(sourceFilePath, '/site/source'),
    },
    source: {
      filePath: sourceFilePath,
      content: content ?? '# Guide',
    },
    ...rest,
  }
}

async function getCorePlugin(engine: ClarifyEngine): Promise<ReturnType<typeof createViteAdapter>[number]> {
  const corePlugin = createViteAdapter(engine).find(plugin => plugin.name === 'clarify:core')
  if (!corePlugin) throw new Error('clarify:core plugin not found')
  return corePlugin
}

async function handleHotUpdate(plugin: Plugin, ctx: HmrContext) {
  const hook = plugin.handleHotUpdate
  if (typeof hook !== 'function') throw new Error('handleHotUpdate hook not found')
  return hook.call({} as never, ctx)
}

async function transform(plugin: Plugin, code: string, id: string) {
  const hook = plugin.transform
  const handler = typeof hook === 'function' ? hook : hook?.handler
  if (!handler) throw new Error(`transform hook not found for ${plugin.name}`)
  return handler.call({} as never, code, id)
}

function resultCode(result: Awaited<ReturnType<typeof transform>>): string {
  if (!result) return ''
  if (typeof result === 'string') return result
  return String(result.code ?? '')
}

describe('createViteAdapter', () => {
  it('keeps final page-hook DOM, metadata, and navigation heading IDs aligned', async () => {
    // Catches route metadata being analyzed before pages:resolved while the
    // Vite adapter compiles the hook's replacement content afterward.
    const root = mkdtempSync(join(tmpdir(), 'clarify-pages-resolved-'))
    const sourceRoot = join(root, 'source')
    const filePath = join(sourceRoot, 'guide.md')
    mkdirSync(sourceRoot)
    writeFileSync(filePath, [
      '---',
      'title: Before hook',
      '---',
      '',
      '# Before DOM',
      '## Before section {#before-section}',
    ].join('\n'))

    try {
      const engine = new ClarifyEngine({
        projectRoot: root,
        plugins: [{
          name: 'replace-page',
          hooks: {
            'pages:resolved': pages => pages.map(page => ({
              ...page,
              frontmatter: { ...page.frontmatter, title: 'After hook' },
              content: '# Final DOM\n\n## 推荐：自动配置 {#auto-config}',
            })),
          },
        }],
      })
      await engine.prepare(undefined, undefined, { skipHints: true })

      const route = engine.routes[0]
      expect(route?.source.content).toBe('# Final DOM\n\n## 推荐：自动配置 {#auto-config}')
      expect(route?.meta).toMatchObject({
        title: 'After hook',
        sections: [{ id: 'auto-config', title: '推荐：自动配置', level: 2, aliases: ['推荐自动配置'] }],
        headingAliases: { 推荐自动配置: 'auto-config' },
      })
      expect(engine.navigation).toMatchObject({
        kind: 'flat',
        nodes: [{
          path: '/guide',
          title: 'After hook',
          sections: [{ id: 'auto-config', title: '推荐：自动配置', level: 2 }],
        }],
      })

      const plugins = createViteAdapter(engine)
      const normalizedContentPlugin = plugins.find(plugin => plugin.name === 'clarify:normalized-content')
      const markdownPlugin = plugins.find(plugin => plugin.name === '@mdx-js/rollup')
      if (!normalizedContentPlugin || !markdownPlugin) throw new Error('Markdown plugin chain not found')

      const normalizedContent = await transform(normalizedContentPlugin, '', filePath)
      const markdownModule = await transform(markdownPlugin, resultCode(normalizedContent), filePath)
      const compiled = resultCode(markdownModule)
      expect(compiled).toContain('id: "auto-config"')
      expect(compiled).toContain('推荐：自动配置')
      expect(compiled).not.toContain('before-section')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('reports invalid heading IDs introduced by a final page hook', async () => {
    // Catches pages:resolved replacing valid content with invalid IDs after
    // discovery diagnostics have already been computed.
    const root = mkdtempSync(join(tmpdir(), 'clarify-pages-invalid-'))
    const sourceRoot = join(root, 'source')
    mkdirSync(sourceRoot)
    writeFileSync(join(sourceRoot, 'guide.mdx'), [
      '---',
      'title: Guide',
      '---',
      '# Initially valid',
    ].join('\n'))

    try {
      const engine = new ClarifyEngine({
        projectRoot: root,
        plugins: [{
          name: 'inject-invalid-heading',
          hooks: {
            'pages:resolved': pages => pages.map(page => ({
              ...page,
              content: '# Final\n\n## Broken {#UPPER}',
            })),
          },
        }],
      })
      await engine.prepare(undefined, undefined, { skipModules: true, skipHints: true })

      expect(engine.routes[0]?.diagnostic).toMatchObject({
        kind: 'markdown+jsx',
        title: 'Heading ID error',
        filePath: 'source/guide.mdx',
        details: expect.stringContaining('Invalid heading ID "UPPER" at 6:1'),
      })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it.each([
    ['markdown', 'md', 'Markdown'],
    ['markdown+jsx', 'mdx', 'MDX'],
  ] as const)('exposes %s transform failures as content diagnostics', async (format, extension, label) => {
    const transformContent = createContentCompileTransform(async () => {
      throw new Error(`${label} plugin failed`)
    }, format, '/site')

    if (typeof transformContent !== 'function') throw new Error('Content transform wrapper not found')
    const result = await transformContent.call({} as never, '# Broken', `/site/source/broken.${extension}?import`)
    const code = resultCode(result)

    expect(code).toContain('createContentDiagnosticComponent(contentDiagnostic)')
    expect(code).toContain(`${label} compilation error`)
    expect(code).toContain(`${label} plugin failed`)
    expect(code).toContain(`source/broken.${extension}`)
    expect(code).not.toContain(`broken.${extension}?import`)
  })

  it('rethrows transform failures under the strict build policy', async () => {
    const error = new Error('Markdown plugin failed')
    const transformContent = createContentCompileTransform(async () => {
      throw error
    }, 'markdown', '/site', () => 'throw')

    if (typeof transformContent !== 'function') throw new Error('Content transform wrapper not found')
    await expect(transformContent.call({} as never, '# Broken', '/site/source/broken.md')).rejects.toBe(error)
  })

  it('preserves successful compiler results and plugin context', async () => {
    const context = { marker: 'plugin-context' }
    const transformContent = createContentCompileTransform(async function (code) {
      return { code: (this as unknown) === context ? code : 'plugin context lost', map: null }
    }, 'markdown', '/site')

    if (typeof transformContent !== 'function') throw new Error('Content transform wrapper not found')
    const result = await transformContent.call(context as never, '# Guide', '/site/guide.md')

    expect(resultCode(result)).toBe('# Guide')
  })

  it('transforms nested Markdown routes through their virtual page modules', async () => {
    const filePath = '/site/source/en/quick-start.md'
    const content = '# Quick Start\n\n<img src="/hero.png">\n'
    const engine = new ClarifyEngine({ projectRoot: '/site' })
    engine.ctx.updateProjectState({ contentRoot: '/site/source' })
    engine.ctx.routes = [createRoute({
      path: '/en/quick-start',
      filePath,
      pageVirtualModuleId: 'virtual:clarify-page/en/quick-start',
      content,
    })]
    await engine.buildModules()

    const plugins = createViteAdapter(engine)
    const corePlugin = plugins.find(plugin => plugin.name === 'clarify:core')
    const normalizedContentPlugin = plugins.find(plugin => plugin.name === 'clarify:normalized-content')
    const markdownPlugin = plugins.find(plugin => plugin.name === '@mdx-js/rollup')
    if (!corePlugin || !normalizedContentPlugin || !markdownPlugin) throw new Error('Markdown plugin chain not found')

    const resolveId = typeof corePlugin.resolveId === 'function' ? corePlugin.resolveId : corePlugin.resolveId?.handler
    const load = typeof corePlugin.load === 'function' ? corePlugin.load : corePlugin.load?.handler
    if (!resolveId || !load) throw new Error('Core virtual module hooks not found')
    const resolvedId = await resolveId.call({} as never, 'virtual:clarify-page/en/quick-start', undefined, { isEntry: false })
    const virtualModule = await load.call({} as never, String(resolvedId), {})
    const normalizedContent = await transform(normalizedContentPlugin, '', filePath)
    const markdownModule = await transform(markdownPlugin, resultCode(normalizedContent) || content, filePath)

    expect(String(virtualModule)).toContain('virtual:clarify-content/en/quick-start.md')
    const sourceModuleId = await resolveId.call({} as never, 'virtual:clarify-content/en/quick-start.md', undefined, { isEntry: false })
    expect(sourceModuleId).toBe(filePath)
    expect(resultCode(markdownModule)).toContain('Quick Start')
    expect(resultCode(markdownModule)).toContain('hero.png')
  })

  it('does not send reloads directly from context route updates', async () => {
    const engine = new ClarifyEngine({ projectRoot: '/site' })
    const sends: unknown[] = []
    const server = createServer(sends)

    const corePlugin = await getCorePlugin(engine)
    const configureServer = corePlugin.configureServer
    if (typeof configureServer !== 'function') throw new Error('configureServer hook not found')
    await configureServer.call({} as never, server)

    await engine.refresh()
    await new Promise<void>(resolve => queueMicrotask(resolve))

    expect(sends).toEqual([])
  })

  it('keeps content-only updates on Vite HMR instead of full reload', async () => {
    const engine = new ClarifyEngine({ projectRoot: '/site' })
    const sends: unknown[] = []
    const server = createServer(sends)
    engine.ctx.updateProjectState({ contentRoot: '/site/source' })
    engine.ctx.routes = [createRoute()]
    engine.ctx.navigation = { kind: 'flat', nodes: [{ path: '/guide', title: 'Guide' }] }
    engine.refresh = async () => {
      engine.ctx.routes = [createRoute({ content: '# Guide\n\nUpdated' })]
      engine.ctx.navigation = { kind: 'flat', nodes: [{ path: '/guide', title: 'Guide' }] }
    }

    const corePlugin = await getCorePlugin(engine)
    const configureServer = corePlugin.configureServer
    if (typeof configureServer !== 'function') throw new Error('configureServer hook not found')
    await configureServer.call({} as never, server)

    const result = await handleHotUpdate(corePlugin, {
      file: '/site/source/guide.md',
      server,
      modules: ['mdx-module'],
    } as never)

    expect(result).toEqual(['mdx-module'])
    expect(sends).toEqual([])
  })

  it('updates the routes module when a content update changes route structure', async () => {
    const engine = new ClarifyEngine({ projectRoot: '/site' })
    const sends: unknown[] = []
    const routesModule = { id: resolveVirtualId(VIRTUAL_ROUTES) } as ModuleNode
    const server = createServer(sends, new Map([[resolveVirtualId(VIRTUAL_ROUTES), routesModule]]))
    engine.ctx.updateProjectState({ contentRoot: '/site/source' })
    engine.ctx.routes = [createRoute()]
    engine.ctx.navigation = { kind: 'flat', nodes: [{ path: '/guide', title: 'Guide' }] }
    engine.refresh = async () => {
      engine.ctx.routes = [createRoute({ title: 'Updated Guide', content: '# Guide\n\nUpdated' })]
      engine.ctx.navigation = { kind: 'flat', nodes: [{ path: '/guide', title: 'Updated Guide' }] }
    }

    const corePlugin = await getCorePlugin(engine)
    const configureServer = corePlugin.configureServer
    if (typeof configureServer !== 'function') throw new Error('configureServer hook not found')
    await configureServer.call({} as never, server)

    const result = await handleHotUpdate(corePlugin, {
      file: '/site/source/guide.md',
      server,
      modules: ['mdx-module'],
    } as never)

    expect(result).toEqual(['mdx-module', routesModule])
    expect(sends).toEqual([])
  })

  it('full reloads route structure changes when the routes module is not in the graph', async () => {
    const engine = new ClarifyEngine({ projectRoot: '/site' })
    const sends: unknown[] = []
    const server = createServer(sends)
    engine.ctx.updateProjectState({ contentRoot: '/site/source' })
    engine.ctx.routes = [createRoute()]
    engine.ctx.navigation = { kind: 'flat', nodes: [{ path: '/guide', title: 'Guide' }] }
    engine.refresh = async () => {
      engine.ctx.routes = [createRoute({ title: 'Updated Guide', content: '# Guide\n\nUpdated' })]
      engine.ctx.navigation = { kind: 'flat', nodes: [{ path: '/guide', title: 'Updated Guide' }] }
    }

    const corePlugin = await getCorePlugin(engine)
    const configureServer = corePlugin.configureServer
    if (typeof configureServer !== 'function') throw new Error('configureServer hook not found')
    await configureServer.call({} as never, server)

    const result = await handleHotUpdate(corePlugin, {
      file: '/site/source/guide.md',
      server,
      modules: ['mdx-module'],
    } as never)

    expect(result).toEqual([])
    expect(sends).toEqual([{ type: 'full-reload' }])
  })
})
