import { describe, expect, it, vi } from 'vitest'

import { handleRequest, type Env } from '../source/index'

const env: Env = {
  GA_API_SECRET: 'secret',
  GA_MEASUREMENT_ID: 'G-test123',
}

describe('analytics API', () => {
  it('reports a valid event to GA4', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 204 }),
    )

    const response = await handleRequest(
      new Request('https://api.example.com/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://clarify.dev',
        },
        body: JSON.stringify({
          client_id: 'client-123',
          event_name: 'docs_search',
          params: { query: 'workers', result_count: 3 },
        }),
      }),
      env,
      fetcher,
    )

    expect(response.status).toBe(204)
    expect(fetcher).toHaveBeenCalledOnce()
    expect(fetcher.mock.calls[0]?.[0].toString()).toBe(
      'https://www.google-analytics.com/mp/collect?measurement_id=G-test123&api_secret=secret',
    )
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({
      client_id: 'client-123',
      events: [
        {
          name: 'docs_search',
          params: { query: 'workers', result_count: 3 },
        },
      ],
    })
  })

  it('rejects invalid event names before calling GA4', async () => {
    const fetcher = vi.fn<typeof fetch>()

    const response = await handleRequest(
      new Request('https://api.example.com/track', {
        method: 'POST',
        body: JSON.stringify({ client_id: 'client-123', event_name: 'bad-name' }),
      }),
      env,
      fetcher,
    )

    expect(response.status).toBe(400)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('logs the GA4 status without exposing it to the client', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 403 }),
    )
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handleRequest(
      new Request('https://api.example.com/track', {
        method: 'POST',
        body: JSON.stringify({
          client_id: 'client-123',
          event_name: 'docs_search',
        }),
      }),
      env,
      fetcher,
    )

    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: 'Analytics request failed' })
    expect(consoleError).toHaveBeenCalledWith(
      'GA4 Measurement Protocol request failed',
      { status: 403 },
    )
  })

  it('allows preflight requests from any origin', async () => {
    const response = await handleRequest(
      new Request('https://api.example.com/track', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://docs.clarify.pub',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'cache-control, content-type, x-custom-header',
        },
      }),
      env,
    )

    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('cache-control, content-type, x-custom-header')
    expect(response.headers.get('Access-Control-Max-Age')).toBe('86400')
  })
})
