import type { OpenApiParameter, OpenApiSecurityScheme, OpenApiServer } from '../types'

import { joinPath } from './helpers'

export type ApiRequestAuth = {
  scheme: OpenApiSecurityScheme
  value: string
}

export type ApiRequestInput = {
  method: string
  path: string
  server: OpenApiServer
  serverVariables?: Record<string, string>
  parameters: OpenApiParameter[]
  parameterValues: Record<string, string>
  parameterEnabled?: Record<string, boolean>
  auth?: ApiRequestAuth[]
  mediaType?: string
  body?: string
  baseUrl?: string
}

export type BuiltApiRequest = {
  url: string
  init: RequestInit
}

function parseBodyObject(body: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(body)
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

function buildRequestBody(body: string, mediaType: string): BodyInit {
  const values = parseBodyObject(body)
  if (mediaType.includes('application/x-www-form-urlencoded') && values) {
    const params = new URLSearchParams()
    Object.entries(values).forEach(([name, value]) => params.append(name, typeof value === 'string' ? value : JSON.stringify(value)))
    return params
  }

  if (mediaType.includes('multipart/form-data') && values) {
    const form = new FormData()
    Object.entries(values).forEach(([name, value]) => form.append(name, typeof value === 'string' ? value : JSON.stringify(value)))
    return form
  }

  return body
}

function expandServerUrl(server: OpenApiServer, variables: Record<string, string>): string {
  return (server.url ?? '').replace(/\{([^}]+)\}/g, (_, name: string) => variables[name] ?? server.variables?.[name]?.default ?? `{${name}}`)
}

function authorizationValue(auth: ApiRequestAuth): string | undefined {
  const scheme = auth.scheme.scheme?.toLowerCase()
  if (auth.scheme.type === 'http' && scheme === 'basic') return `Basic ${auth.value}`
  if (auth.scheme.type === 'http' && scheme === 'bearer') return `Bearer ${auth.value}`
  if (auth.scheme.type === 'oauth2' || auth.scheme.type === 'openIdConnect') return `Bearer ${auth.value}`
  return undefined
}

export function parameterKey(parameter: OpenApiParameter): string {
  return `${parameter.in ?? 'query'}:${parameter.name ?? ''}`
}

function parseParameterValue(value: string): unknown {
  const trimmed = value.trim()
  if (!trimmed || (!trimmed.startsWith('[') && !trimmed.startsWith('{'))) return value

  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function primitiveValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === null || typeof value === 'undefined') return ''
  return String(value)
}

function serializedParameterValues(parameter: OpenApiParameter, rawValue: string): Array<[string, string]> {
  const value = parseParameterValue(rawValue)
  const style = parameter.style ?? (parameter.in === 'query' || parameter.in === 'cookie' ? 'form' : 'simple')
  const explode = parameter.explode ?? style === 'form'

  if (Array.isArray(value)) {
    if (explode) return value.map((item) => [parameter.name ?? '', primitiveValue(item)])
    const delimiter = style === 'spaceDelimited' ? ' ' : style === 'pipeDelimited' ? '|' : ','
    return [[parameter.name ?? '', value.map(primitiveValue).join(delimiter)]]
  }

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value)
    if (parameter.style === 'deepObject') return entries.map(([key, item]) => [`${parameter.name}[${key}]`, primitiveValue(item)])
    if (explode) return entries.map(([key, item]) => [key, primitiveValue(item)])
    return [[parameter.name ?? '', entries.flatMap(([key, item]) => [key, primitiveValue(item)]).join(',')]]
  }

  return [[parameter.name ?? '', primitiveValue(value)]]
}

function pathParameterValue(parameter: OpenApiParameter, rawValue: string): string {
  const value = parseParameterValue(rawValue)
  const style = parameter.style ?? 'simple'
  const explode = parameter.explode ?? false
  const encode = (item: unknown) => encodeURIComponent(primitiveValue(item))

  if (Array.isArray(value)) {
    if (style === 'label') return `.${value.map(encode).join(explode ? '.' : ',')}`
    if (style === 'matrix') return explode
      ? value.map((item) => `;${parameter.name}=${encode(item)}`).join('')
      : `;${parameter.name}=${value.map(encode).join(',')}`
    return value.map(encode).join(',')
  }

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value)
    if (style === 'label') return explode
      ? `.${entries.map(([key, item]) => `${encode(key)}=${encode(item)}`).join('.')}`
      : `.${entries.flatMap(([key, item]) => [encode(key), encode(item)]).join(',')}`
    if (style === 'matrix') return explode
      ? entries.map(([key, item]) => `;${encode(key)}=${encode(item)}`).join('')
      : `;${parameter.name}=${entries.flatMap(([key, item]) => [encode(key), encode(item)]).join(',')}`
    return explode
      ? entries.map(([key, item]) => `${encode(key)}=${encode(item)}`).join(',')
      : entries.flatMap(([key, item]) => [encode(key), encode(item)]).join(',')
  }

  const encoded = encode(value)
  if (style === 'label') return `.${encoded}`
  if (style === 'matrix') return `;${parameter.name}=${encoded}`
  return encoded
}

function headerParameterValue(parameter: OpenApiParameter, rawValue: string): string {
  const value = parseParameterValue(rawValue)
  if (Array.isArray(value)) return value.map(primitiveValue).join(',')
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value)
    return parameter.explode
      ? entries.map(([key, item]) => `${key}=${primitiveValue(item)}`).join(',')
      : entries.flatMap(([key, item]) => [key, primitiveValue(item)]).join(',')
  }
  return primitiveValue(value)
}

export function buildApiRequest(input: ApiRequestInput): BuiltApiRequest {
  const headers = new Headers({ Accept: 'application/json' })
  const query = new URLSearchParams()
  let path = input.path

  for (const parameter of input.parameters) {
    if (!parameter.name) continue
    const key = parameterKey(parameter)
    if (input.parameterEnabled?.[key] === false) continue
    const value = input.parameterValues[key] ?? ''
    if (!value && !parameter.allowEmptyValue) continue

    if (parameter.in === 'path') path = path.replaceAll(`{${parameter.name}}`, pathParameterValue(parameter, value))
    if (parameter.in === 'query') serializedParameterValues(parameter, value).forEach(([name, item]) => query.append(name, item))
    if (parameter.in === 'header') headers.set(parameter.name, headerParameterValue(parameter, value))
  }

  for (const auth of input.auth ?? []) {
    if (!auth.value) continue
    if (auth.scheme.type === 'apiKey' && auth.scheme.in === 'query' && auth.scheme.name) {
      query.set(auth.scheme.name, auth.value)
    } else if (auth.scheme.type === 'apiKey' && auth.scheme.in === 'header' && auth.scheme.name) {
      headers.set(auth.scheme.name, auth.value)
    } else {
      const authorization = authorizationValue(auth)
      if (authorization) headers.set('Authorization', authorization)
    }
  }

  const url = new URL(joinPath(expandServerUrl(input.server, input.serverVariables ?? {}), path), input.baseUrl)
  query.forEach((value, key) => url.searchParams.append(key, value))

  const body = input.body?.trim()
  const mediaType = input.mediaType || 'application/json'
  const requestBody = body && input.method.toUpperCase() !== 'GET' && input.method.toUpperCase() !== 'HEAD'
    ? buildRequestBody(body, mediaType)
    : undefined
  if (requestBody && !(requestBody instanceof FormData)) {
    headers.set('Content-Type', mediaType)
  }

  return {
    url: url.toString(),
    init: {
      method: input.method.toUpperCase(),
      headers,
      credentials: 'include',
      ...(requestBody ? { body: requestBody } : {}),
    },
  }
}
