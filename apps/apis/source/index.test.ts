import { describe, expect, it, vi } from 'vitest'

import { handleRequest, type Env } from '../source/index'

const env: Env = {
  GA_API_SECRET: 'secret',
  GA_MEASUREMENT_ID: 'G-test123',
  ALLOWED_ORIGINS: 'https://clarify.dev',
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

  it('rejects preflight requests from unknown origins', async () => {
    const response = await handleRequest(
      new Request('https://api.example.com/track', {
        method: 'OPTIONS',
        headers: { Origin: 'https://unknown.example' },
      }),
      env,
    )

    expect(response.status).toBe(403)
  })
})
