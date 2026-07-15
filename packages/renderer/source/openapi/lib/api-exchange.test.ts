import { describe, expect, it, vi } from 'vitest'

import { executeApiRequest } from './api-exchange'

describe('executeApiRequest', () => {
  it('captures the request and complete response metadata', async () => {
    const fetch = vi.fn(async () => new Response('{"ok":true}', {
      status: 201,
      statusText: 'Created',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': 'req-1',
      },
    }))
    const times = [10, 24]

    const exchange = await executeApiRequest({
      url: 'https://api.example.com/items',
      init: {
        method: 'POST',
        headers: { Authorization: 'Bearer secret', 'Content-Type': 'application/json' },
        body: '{"name":"Ada"}',
      },
    }, { fetch, now: () => times.shift() ?? 24 })

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/items', expect.objectContaining({ method: 'POST' }))
    expect(exchange.request).toEqual({
      url: 'https://api.example.com/items',
      method: 'POST',
      headers: [['authorization', 'Bearer secret'], ['content-type', 'application/json']],
      body: '{"name":"Ada"}',
    })
    expect(exchange).toEqual(expect.objectContaining({
      status: 201,
      statusText: 'Created',
      duration: 14,
      size: 11,
      contentType: 'application/json',
      body: '{"ok":true}',
    }))
    expect(exchange.headers).toContainEqual(['x-request-id', 'req-1'])
  })

  it('preserves binary response bytes', async () => {
    const bytes = new Uint8Array([0, 1, 2, 255])
    const exchange = await executeApiRequest({
      url: 'https://api.example.com/file',
      init: { method: 'GET' },
    }, {
      fetch: async () => new Response(bytes, { headers: { 'Content-Type': 'application/octet-stream' } }),
      now: () => 0,
    })

    expect(exchange.size).toBe(4)
    expect(new Uint8Array(await exchange.blob.arrayBuffer())).toEqual(bytes)
  })

  it('preserves empty response metadata without inventing content', async () => {
    const exchange = await executeApiRequest({
      url: 'https://api.example.com/items/1',
      init: { method: 'DELETE' },
    }, {
      fetch: async () => new Response(null, { status: 204, headers: { 'X-Request-Id': 'req-empty' } }),
      now: () => 0,
    })

    expect(exchange).toEqual(expect.objectContaining({
      status: 204,
      size: 0,
      contentType: '',
      body: '',
    }))
    expect(exchange.headers).toContainEqual(['x-request-id', 'req-empty'])
  })

  it('classifies fetch failures as network errors and preserves the cause', async () => {
    const cause = new TypeError('Failed to fetch')

    await expect(executeApiRequest({ url: 'https://offline.example.com', init: {} }, {
      fetch: async () => { throw cause },
    })).rejects.toMatchObject({
      name: 'ApiRequestError',
      category: 'network',
      message: 'Failed to fetch',
      cause,
    })
  })

  it('forwards abort signals to fetch', async () => {
    const controller = new AbortController()
    controller.abort()
    const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      return new Response()
    })

    await expect(executeApiRequest({ url: 'https://api.example.com', init: {} }, {
      fetch,
      signal: controller.signal,
    })).rejects.toMatchObject({ name: 'AbortError' })
  })
})
