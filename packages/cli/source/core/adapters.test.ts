import type { ViteDevServer } from 'vite'
import { describe, expect, it } from 'vitest'

import type { ContentRoute } from '../../types.js'

import { createViteAdapter } from './adapters.js'
import { ClarifyEngine } from './engine/engine.js'

function createServer(sends: unknown[] = []): ViteDevServer {
  return {
    watcher: {
      add: () => undefined,
      on: () => undefined,
    },
    moduleGraph: {
      getModuleById: () => undefined,
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

function createRoute(overrides: Partial<ContentRoute> = {}): ContentRoute {
  return {
    path: '/guide',
    title: 'Guide',
    filePath: '/site/source/guide.md',
    virtualModuleId: 'virtual:clarify-page/guide',
    kind: 'mdx',
    content: '# Guide',
    ...overrides,
  }
}

async function getCorePlugin(engine: ClarifyEngine): Promise<ReturnType<typeof createViteAdapter>[number]> {
  const corePlugin = createViteAdapter(engine).find(plugin => plugin.name === 'clarify:core')
  if (!corePlugin) throw new Error('clarify:core plugin not found')
  return corePlugin
}

describe('createViteAdapter', () => {
  it('uses context route updates as the single dev full-reload signal', async () => {
    const engine = new ClarifyEngine({ projectRoot: '/site' })
    const sends: unknown[] = []
    const server = createServer(sends)

    const corePlugin = await getCorePlugin(engine)
    const configureServer = corePlugin.configureServer
    if (typeof configureServer !== 'function') throw new Error('configureServer hook not found')
    await configureServer.call({} as never, server)

    await engine.refresh()
    await new Promise<void>(resolve => queueMicrotask(resolve))

    expect(sends).toEqual([{ type: 'full-reload' }])
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

    const result = await corePlugin.handleHotUpdate?.({
      file: '/site/source/guide.md',
      server,
    } as never)

    expect(result).toBeUndefined()
    expect(sends).toEqual([])
  })

  it('full reloads when a content update changes route structure', async () => {
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

    const result = await corePlugin.handleHotUpdate?.({
      file: '/site/source/guide.md',
      server,
    } as never)

    expect(result).toEqual([])
    expect(sends).toEqual([{ type: 'full-reload' }])
  })
})
