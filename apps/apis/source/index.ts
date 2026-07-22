export interface Env {
  GA_API_SECRET: string
  GA_MEASUREMENT_ID: string
  ALLOWED_ORIGINS?: string
}

type EventParam = string | number | boolean

type TrackPayload = {
  client_id?: unknown
  user_id?: unknown
  event_name?: unknown
  params?: unknown
}

type Fetcher = typeof fetch

const eventNamePattern = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/
const maxParams = 25

function getAllowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get('Origin')
  if (!origin) return null

  const allowedOrigins = env.ALLOWED_ORIGINS
    ?.split(',')
    .map(value => value.trim())
    .filter(Boolean)

  return allowedOrigins?.includes(origin) ? origin : null
}

function responseHeaders(request: Request, env: Env): Headers {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
  })
  const allowedOrigin = getAllowedOrigin(request, env)

  if (allowedOrigin) {
    headers.set('Access-Control-Allow-Origin', allowedOrigin)
    headers.set('Vary', 'Origin')
  }

  return headers
}

function jsonResponse(
  request: Request,
  env: Env,
  body: Record<string, string>,
  status: number,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(request, env),
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

async function trackEvent(
  payload: TrackPayload,
  env: Env,
  fetcher: Fetcher,
): Promise<boolean> {
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
      events: [
        {
          name: body.event_name,
          params: body.params ?? {},
        },
      ],
    }),
  })

  return result.ok
}

export async function handleRequest(
  request: Request,
  env: Env,
  fetcher: Fetcher = fetch,
): Promise<Response> {
  const url = new URL(request.url)
  const headers = responseHeaders(request, env)

  if (request.method === 'OPTIONS') {
    if (!getAllowedOrigin(request, env)) {
      return new Response(null, { status: 403, headers })
    }

    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type')
    return new Response(null, { status: 204, headers })
  }

  if (url.pathname === '/health' && request.method === 'GET') {
    return jsonResponse(request, env, { status: 'ok' }, 200)
  }

  if (url.pathname !== '/track' || request.method !== 'POST') {
    return jsonResponse(request, env, { error: 'Not found' }, 404)
  }

  if (!env.GA_API_SECRET || !env.GA_MEASUREMENT_ID) {
    return jsonResponse(request, env, { error: 'Analytics is not configured' }, 503)
  }

  let payload: TrackPayload
  try {
    payload = (await request.json()) as TrackPayload
  } catch {
    return jsonResponse(request, env, { error: 'Invalid JSON' }, 400)
  }

  if (!isValidPayload(payload)) {
    return jsonResponse(request, env, { error: 'Invalid event payload' }, 400)
  }

  try {
    if (!(await trackEvent(payload, env, fetcher))) {
      return jsonResponse(request, env, { error: 'Analytics request failed' }, 502)
    }
  } catch {
    return jsonResponse(request, env, { error: 'Analytics request failed' }, 502)
  }

  return new Response(null, { status: 204, headers })
}

export default {
  fetch: handleRequest,
}
