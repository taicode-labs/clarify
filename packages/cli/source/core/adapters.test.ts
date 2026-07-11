import type { HmrContext, ModuleNode, Plugin, ViteDevServer } from 'vite'
import { describe, expect, it } from 'vitest'

import type { ContentRoute } from '../types.js'

import { createViteAdapter } from './adapters.js'
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

describe('createViteAdapter', () => {
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
    engine.ctx.navigation = [{ path: '/guide', title: 'Guide' }]
    engine.refresh = async () => {
      engine.ctx.routes = [createRoute({ content: '# Guide\n\nUpdated' })]
      engine.ctx.navigation = [{ path: '/guide', title: 'Guide' }]
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
    engine.ctx.navigation = [{ path: '/guide', title: 'Guide' }]
    engine.refresh = async () => {
      engine.ctx.routes = [createRoute({ title: 'Updated Guide', content: '# Guide\n\nUpdated' })]
      engine.ctx.navigation = [{ path: '/guide', title: 'Updated Guide' }]
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
    engine.ctx.navigation = [{ path: '/guide', title: 'Guide' }]
    engine.refresh = async () => {
      engine.ctx.routes = [createRoute({ title: 'Updated Guide', content: '# Guide\n\nUpdated' })]
      engine.ctx.navigation = [{ path: '/guide', title: 'Updated Guide' }]
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
