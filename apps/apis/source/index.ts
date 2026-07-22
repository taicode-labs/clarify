export interface Env {
  GA_API_SECRET: string
  GA_MEASUREMENT_ID: string
}

type EventParam = string | number | boolean

type TrackPayload = {
  client_id?: unknown
  user_id?: unknown
  event_name?: unknown
  params?: unknown
}

type Fetcher = typeof fetch

type AnalyticsResult = {
  ok: boolean
  status: number
}

const eventNamePattern = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/
const maxParams = 25

function responseHeaders(): Headers {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  })

  return headers
}

function jsonResponse(body: Record<string, string>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(),
  })
}

function isEventParams(value: unknown): value is Record<string, EventParam> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  const entries = Object.entries(value)
  return (
    entries.length <= maxParams &&
    entries.every(
      ([key, entry]) =>
        /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(key) &&
        (typeof entry === 'string' ||
          typeof entry === 'number' ||
          typeof entry === 'boolean'),
    )
  )
}

function isValidPayload(payload: TrackPayload): payload is {
  client_id: string
  user_id?: string
  event_name: string
  params?: Record<string, EventParam>
} {
  return (
    typeof payload.client_id === 'string' &&
    payload.client_id.length > 0 &&
    payload.client_id.length <= 100 &&
    (payload.user_id === undefined ||
      (typeof payload.user_id === 'string' && payload.user_id.length <= 100)) &&
    typeof payload.event_name === 'string' &&
    eventNamePattern.test(payload.event_name) &&
    (payload.params === undefined || isEventParams(payload.params))
  )
}

async function trackEvent(payload: TrackPayload, ipOverride: string | null, env: Env, fetcher: Fetcher): Promise<AnalyticsResult> {
  const endpoint = new URL('https://www.google-analytics.com/mp/collect')
  endpoint.searchParams.set('measurement_id', env.GA_MEASUREMENT_ID)
  endpoint.searchParams.set('api_secret', env.GA_API_SECRET)

  const body = payload as {
    client_id: string
    user_id?: string
    event_name: string
    params?: Record<string, EventParam>
  }

  const result = await fetcher(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: body.client_id,
      ...(body.user_id ? { user_id: body.user_id } : {}),
      ...(ipOverride ? { ip_override: ipOverride } : {}),
      events: [
        {
          name: body.event_name,
          params: body.params ?? {},
        },
      ],
    }),
  })

  return {
    ok: result.ok,
    status: result.status,
  }
}

export async function handleRequest(request: Request, env: Env, fetcher: Fetcher = fetch): Promise<Response> {
  const url = new URL(request.url)
  const headers = responseHeaders()

  if (request.method === 'OPTIONS') {
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    headers.set(
      'Access-Control-Allow-Headers',
      request.headers.get('Access-Control-Request-Headers') ?? '*',
    )
    headers.set('Access-Control-Max-Age', '86400')
    return new Response(null, { status: 204, headers })
  }

  if (url.pathname === '/health' && request.method === 'GET') {
    return jsonResponse({ status: 'ok' }, 200)
  }

  if (url.pathname !== '/track' || request.method !== 'POST') {
    return jsonResponse({ error: 'Not found' }, 404)
  }

  if (!env.GA_API_SECRET || !env.GA_MEASUREMENT_ID) {
    return jsonResponse({ error: 'Analytics is not configured' }, 503)
  }

  let payload: TrackPayload
  try {
    payload = (await request.json()) as TrackPayload
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400)
  }

  if (!isValidPayload(payload)) {
    return jsonResponse({ error: 'Invalid event payload' }, 400)
  }

  try {
    const analyticsResult = await trackEvent(
      payload,
      request.headers.get('CF-Connecting-IP'),
      env,
      fetcher,
    )
    if (!analyticsResult.ok) {
      console.error('GA4 Measurement Protocol request failed', {
        status: analyticsResult.status,
      })
      return jsonResponse({ error: 'Analytics request failed' }, 502)
    }
  } catch (error) {
    console.error('GA4 Measurement Protocol request threw', {
      error: error instanceof Error ? error.message : String(error),
    })
    return jsonResponse({ error: 'Analytics request failed' }, 502)
  }

  return new Response(null, { status: 204, headers })
}

export function workerFetch(request: Request, env: Env, _context: ExecutionContext): Promise<Response> {
  return handleRequest(request, env)
}

export default {
  fetch: workerFetch,
} satisfies ExportedHandler<Env>
