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
  streaming?: boolean
}

export type ExecuteApiRequestOptions = {
  signal?: AbortSignal
  fetch?: typeof fetch
  now?: () => number
  onProgress?: (exchange: ApiResponseExchange) => void
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

function isEventStream(contentType: string): boolean {
  return contentType.split(';', 1)[0].trim().toLowerCase() === 'text/event-stream'
}

export async function executeApiRequest(request: BuiltApiRequest, options: ExecuteApiRequestOptions = {}): Promise<ApiResponseExchange> {
  const fetchRequest = options.fetch ?? fetch
  const now = options.now ?? (() => performance.now())
  const onProgress = options.onProgress
  const startedAt = now()
  let response: Response

  try {
    response = await fetchRequest(request.url, { ...request.init, signal: options.signal })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    const message = cause instanceof Error ? cause.message : String(cause)
    throw new ApiRequestError(message, { cause })
  }

  const contentType = response.headers.get('content-type') ?? ''
  const headers = Array.from(response.headers.entries())
  const requestSnapshotValue = requestSnapshot(request)

  if (isEventStream(contentType) && response.body) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let body = ''
    let totalSize = 0
    const emit = (streaming: boolean) => {
      const blob = new Blob([body], { type: contentType })
      onProgress?.({ request: requestSnapshotValue, status: response.status, statusText: response.statusText, url: response.url || request.url, redirected: response.redirected, duration: Math.round(now() - startedAt), size: totalSize, headers, contentType, body, blob, streaming })
    }

    emit(true)
    while (true) {
      const result = await reader.read()
      if (result.done) break
      totalSize += result.value.byteLength
      body += decoder.decode(result.value, { stream: true })
      emit(true)
    }
    body += decoder.decode()
    const blob = new Blob([body], { type: contentType })
    const exchange = { request: requestSnapshotValue, status: response.status, statusText: response.statusText, url: response.url || request.url, redirected: response.redirected, duration: Math.round(now() - startedAt), size: totalSize, headers, contentType, body, blob, streaming: false }
    onProgress?.(exchange)
    return exchange
  }

  const blob = await response.blob()

  return {
    request: requestSnapshotValue,
    status: response.status,
    statusText: response.statusText,
    url: response.url || request.url,
    redirected: response.redirected,
    duration: Math.round(now() - startedAt),
    size: blob.size,
    headers,
    contentType: contentType || blob.type,
    body: await blob.text(),
    blob,
  }
}
