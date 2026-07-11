import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

import type { OpenApiRecord } from '../types'

export type OpenAPISpec = OpenAPIV3.Document | OpenAPIV3_1.Document
export type OpenAPIOperation = OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject

export const OPENAPI_HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const

export type OpenAPIHttpMethod = typeof OPENAPI_HTTP_METHODS[number]
export type OpenAPIOperationSource = 'path' | 'webhook'
export type OpenAPIOperationEntry = { path: string; method: OpenAPIHttpMethod; operation: OpenAPIOperation; source: OpenAPIOperationSource }

export function isOpenAPIHttpMethod(method: string): method is OpenAPIHttpMethod {
  return (OPENAPI_HTTP_METHODS as readonly string[]).includes(method.toLowerCase())
}

function isRecord(value: unknown): value is OpenApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function resolveOpenApiRef(spec: OpenAPISpec, ref: string): unknown {
  if (!ref.startsWith('#/')) return undefined

  return ref
    .slice(2)
    .split('/')
    .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce<unknown>((current, part) => (isRecord(current) ? current[part] : undefined), spec)
}

function getPathItem(spec: OpenAPISpec, path: string): OpenApiRecord | undefined {
  const pathItem = spec.paths?.[path]
  const resolved = isRecord(pathItem) && typeof pathItem.$ref === 'string' ? resolveOpenApiRef(spec, pathItem.$ref) : pathItem
  return isRecord(resolved) ? resolved : undefined
}

function getWebhookItem(spec: OpenAPISpec, path: string): OpenApiRecord | undefined {
  const webhooks = (spec as OpenApiRecord).webhooks
  const pathItem = isRecord(webhooks) ? webhooks[path] : undefined
  const resolved = isRecord(pathItem) && typeof pathItem.$ref === 'string' ? resolveOpenApiRef(spec, pathItem.$ref) : pathItem
  return isRecord(resolved) ? resolved : undefined
}

function listOperationsFromPathItems(items: Record<string, unknown>, source: OpenAPIOperationSource, spec: OpenAPISpec): OpenAPIOperationEntry[] {
  const operations: OpenAPIOperationEntry[] = []

  for (const path of Object.keys(items)) {
    const pathItem = source === 'webhook' ? getWebhookItem(spec, path) : getPathItem(spec, path)
    if (!pathItem) continue
    for (const method of OPENAPI_HTTP_METHODS) {
      const operation = pathItem[method]
      if (operation) operations.push({ path, method, operation: operation as OpenAPIOperation, source })
    }
  }

  return operations
}

export function getOpenApiOperation(spec: OpenAPISpec, path: string, method: string): OpenAPIOperation | undefined {
  if (!isOpenAPIHttpMethod(method)) return undefined
  return getPathItem(spec, path)?.[method.toLowerCase() as OpenAPIHttpMethod] as OpenAPIOperation | undefined
}

export function listOpenApiOperations(spec: OpenAPISpec): OpenAPIOperationEntry[] {
  const paths = spec.paths ?? {}
  const webhooks = (spec as OpenApiRecord).webhooks

  return [
    ...listOperationsFromPathItems(paths, 'path', spec),
    ...(isRecord(webhooks) ? listOperationsFromPathItems(webhooks, 'webhook', spec) : []),
  ]
}
