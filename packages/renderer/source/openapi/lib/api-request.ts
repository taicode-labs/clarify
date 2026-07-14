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
  auth?: ApiRequestAuth
  mediaType?: string
  body?: string
  baseUrl?: string
}

export type BuiltApiRequest = {
  url: string
  init: RequestInit
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

export function buildApiRequest(input: ApiRequestInput): BuiltApiRequest {
  const headers = new Headers({ Accept: 'application/json' })
  const query = new URLSearchParams()
  let path = input.path

  for (const parameter of input.parameters) {
    if (!parameter.name) continue
    const value = input.parameterValues[parameterKey(parameter)] ?? ''
    if (!value) continue

    if (parameter.in === 'path') path = path.replaceAll(`{${parameter.name}}`, encodeURIComponent(value))
    if (parameter.in === 'query') query.append(parameter.name, value)
    if (parameter.in === 'header') headers.set(parameter.name, value)
  }

  if (input.auth?.value) {
    if (input.auth.scheme.type === 'apiKey' && input.auth.scheme.in === 'query' && input.auth.scheme.name) {
      query.set(input.auth.scheme.name, input.auth.value)
    } else if (input.auth.scheme.type === 'apiKey' && input.auth.scheme.in === 'header' && input.auth.scheme.name) {
      headers.set(input.auth.scheme.name, input.auth.value)
    } else {
      const authorization = authorizationValue(input.auth)
      if (authorization) headers.set('Authorization', authorization)
    }
  }

  const url = new URL(joinPath(expandServerUrl(input.server, input.serverVariables ?? {}), path), input.baseUrl)
  query.forEach((value, key) => url.searchParams.append(key, value))

  const body = input.body?.trim()
  if (body && input.method.toUpperCase() !== 'GET' && input.method.toUpperCase() !== 'HEAD') {
    headers.set('Content-Type', input.mediaType || 'application/json')
  }

  return {
    url: url.toString(),
    init: {
      method: input.method.toUpperCase(),
      headers,
      ...(body && input.method.toUpperCase() !== 'GET' && input.method.toUpperCase() !== 'HEAD' ? { body } : {}),
    },
  }
}
