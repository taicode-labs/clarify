import type { ViteDevServer } from 'vite'
import { describe, expect, it } from 'vitest'

import { createViteAdapter } from './adapters.js'
import { ClarifyEngine } from './engine/engine.js'

describe('createViteAdapter', () => {
  it('uses context route updates as the single dev full-reload signal', async () => {
    const engine = new ClarifyEngine({ projectRoot: '/site' })
    const sends: unknown[] = []
    const server = {
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

    const corePlugin = createViteAdapter(engine).find(plugin => plugin.name === 'clarify:core')
  const configureServer = corePlugin?.configureServer
  if (typeof configureServer !== 'function') throw new Error('configureServer hook not found')
    await configureServer.call({} as never, server)

    await engine.refresh()
    await new Promise<void>(resolve => queueMicrotask(resolve))

    expect(sends).toEqual([{ type: 'full-reload' }])
  })
})
