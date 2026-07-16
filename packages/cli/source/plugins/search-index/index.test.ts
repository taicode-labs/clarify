import { EventEmitter } from 'node:events'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createSearchIndexPlugin } from './index.js'

const { createIndexMock, closeMock } = vi.hoisted(() => ({
  createIndexMock: vi.fn(),
  closeMock: vi.fn(),
}))

vi.mock('pagefind', () => ({
  createIndex: createIndexMock,
  close: closeMock,
}))

describe('createSearchIndexPlugin', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    createIndexMock.mockReset()
    closeMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps the shared pagefind backend available across dev regenerations', async () => {
    const addCustomRecord = vi.fn().mockResolvedValue({ errors: undefined })
    const writeFiles = vi.fn().mockResolvedValue({ errors: undefined })
    const deleteIndex = vi.fn().mockResolvedValue(undefined)
    let backendClosed = false

    closeMock.mockImplementation(async () => {
      backendClosed = true
    })

    createIndexMock.mockImplementation(async () => {
      if (backendClosed) {
        throw new Error('Pagefind backend closed')
      }

      return {
        errors: undefined,
        index: {
          addCustomRecord,
          writeFiles,
          deleteIndex,
        },
      }
    })

    const plugin = createSearchIndexPlugin()
    const watcher = new EventEmitter()
    const httpServer = new EventEmitter()
    const server = {
      middlewares: { use: vi.fn() },
      watcher,
      httpServer,
    } as never

    const ctx = {
      projectConfig: {
        routePrefix: '/',
        locales: {
          default: 'en-US',
          missing: 'fallback',
          locales: [{ code: 'en-US', label: 'English' }],
        },
        features: { search: { enabled: true, provider: 'pagefind' } },
      },
      routes: [{
        path: '/docs',
        locale: 'en-US',
        kind: 'mdx',
        meta: { title: 'Docs' },
        module: { virtualModuleId: 'virtual:clarify-page/docs' },
        source: { filePath: '/site/source/docs.mdx', content: 'Docs content' },
      }],
    } as never

    const configureServer = plugin.hooks?.['dev:configureServer']
    expect(configureServer).toBeTypeOf('function')
    if (!configureServer) throw new Error('dev:configureServer hook is missing')

    await configureServer(server as never, ctx as never)

    watcher.emit('change', '/site/source/docs.mdx')
    await vi.runAllTimersAsync()

    watcher.emit('change', '/site/source/guide.mdx')
    await vi.runAllTimersAsync()

    expect(createIndexMock).toHaveBeenCalledTimes(3)
    expect(backendClosed).toBe(false)
    httpServer.emit('close')
  })
})
