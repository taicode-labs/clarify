import type { BuiltApiRequest } from './api-request'

export type ApiRequestSnapshot = {
  url: string
  method: string
  headers: Array<[string, string]>
  body?: string
}

export type ApiResponseExchange = {
  request: ApiRequestSnapshot
  status: number
  statusText: string
  url: string
  redirected: boolean
  duration: number
  size: number
  headers: Array<[string, string]>
  contentType: string
  body: string
  blob: Blob
}

export type ExecuteApiRequestOptions = {
  signal?: AbortSignal
  fetch?: typeof fetch
  now?: () => number
}

export class ApiRequestError extends Error {
  readonly category: 'network'

  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ApiRequestError'
    this.category = 'network'
  }
}

function requestBodySnapshot(body: BodyInit | null | undefined): string | undefined {
  if (typeof body === 'string') return body
  if (body instanceof URLSearchParams) return body.toString()
  return undefined
}

function requestSnapshot(request: BuiltApiRequest): ApiRequestSnapshot {
  return {
    url: request.url,
    method: request.init.method ?? 'GET',
    headers: Array.from(new Headers(request.init.headers).entries()),
    body: requestBodySnapshot(request.init.body),
  }
}

export async function executeApiRequest(request: BuiltApiRequest, options: ExecuteApiRequestOptions = {}): Promise<ApiResponseExchange> {
  const fetchRequest = options.fetch ?? fetch
  const now = options.now ?? (() => performance.now())
  const startedAt = now()
  let response: Response

  try {
    response = await fetchRequest(request.url, { ...request.init, signal: options.signal })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    const message = cause instanceof Error ? cause.message : String(cause)
    throw new ApiRequestError(message, { cause })
  }

  const blob = await response.blob()

  return {
    request: requestSnapshot(request),
    status: response.status,
    statusText: response.statusText,
    url: response.url || request.url,
    redirected: response.redirected,
    duration: Math.round(now() - startedAt),
    size: blob.size,
    headers: Array.from(response.headers.entries()),
    contentType: response.headers.get('content-type') ?? blob.type,
    body: await blob.text(),
    blob,
  }
}
