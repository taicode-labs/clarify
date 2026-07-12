import type { HmrContext, ModuleNode, Plugin, ViteDevServer } from 'vite'
import { describe, expect, it } from 'vitest'

import type { ContentRoute } from '../types.js'

import { createContentCompileTransform, createViteAdapter } from './adapters.js'
import { ClarifyEngine } from './engine/engine.js'
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

type RouteFixture = Partial<Omit<ContentRoute, 'meta' | 'module' | 'source'>> & {
  title?: string
  filePath?: string
  virtualModuleId?: string
  content?: string
}

function createRoute(overrides: RouteFixture = {}): ContentRoute {
  const { title, filePath, virtualModuleId, content, ...rest } = overrides
  return {
    path: '/guide',
    kind: 'mdx',
    meta: { title: title ?? 'Guide' },
    module: { virtualModuleId: virtualModuleId ?? 'virtual:clarify-page/guide' },
    source: {
      filePath: filePath ?? '/site/source/guide.md',
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
  it.each([
    ['markdown', 'md', 'Markdown'],
    ['mdx', 'mdx', 'MDX'],
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
      virtualModuleId: 'virtual:clarify-page/en/quick-start',
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

    expect(String(virtualModule)).toContain(filePath)
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
