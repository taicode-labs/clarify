import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { slug } from 'github-slugger'

import type { OpenApiRecord } from '../types'

export type OpenAPISpec = OpenAPIV3.Document | OpenAPIV3_1.Document
export type OpenAPIOperation = OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject

export const OPENAPI_HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const

export type OpenAPIHttpMethod = typeof OPENAPI_HTTP_METHODS[number]
export type OpenAPIOperationSource = 'path' | 'webhook'
export type OpenAPIOperationEntry = { path: string; method: OpenAPIHttpMethod; operation: OpenAPIOperation; source: OpenAPIOperationSource }

export const CLARIFY_OPENAPI_SECTION_ID_EXTENSION = 'x-clarify-section-id'

export function getOpenApiOperationSectionId(operation: OpenAPIOperation): string {
  const sectionId = (operation as OpenApiRecord)[CLARIFY_OPENAPI_SECTION_ID_EXTENSION]
  return typeof sectionId === 'string' ? sectionId : ''
}

function createOpenApiOperationSectionId(operation: OpenApiRecord, method: string, path: string, source: OpenAPIOperationSource): string {
  const operationId = typeof operation.operationId === 'string' ? operation.operationId.trim() : ''
  return operationId || slug(`${source === 'webhook' ? 'webhook ' : ''}${method.toLowerCase()} ${path}`)
}

function normalizeOpenApiOperationSectionId(operation: OpenApiRecord, method: string, path: string, source: OpenAPIOperationSource): OpenAPIOperation {
  const sectionId = operation[CLARIFY_OPENAPI_SECTION_ID_EXTENSION]
  if (typeof sectionId !== 'string' || !sectionId) {
    operation[CLARIFY_OPENAPI_SECTION_ID_EXTENSION] = createOpenApiOperationSectionId(operation, method, path, source)
  }
  return operation as OpenAPIOperation
}

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
      if (isRecord(operation)) operations.push({ path, method, operation: normalizeOpenApiOperationSectionId(operation, method, path, source), source })
    }
  }

  return operations
}

export function getOpenApiOperation(spec: OpenAPISpec, path: string, method: string): OpenAPIOperation | undefined {
  return getOpenApiOperationEntry(spec, path, method)?.operation
}

export function getOpenApiOperationEntry(spec: OpenAPISpec, path: string, method: string, source?: OpenAPIOperationSource): OpenAPIOperationEntry | undefined {
  if (!isOpenAPIHttpMethod(method)) return undefined

  const normalizedMethod = method.toLowerCase() as OpenAPIHttpMethod
  const sources: OpenAPIOperationSource[] = source ? [source] : ['path', 'webhook']
  for (const currentSource of sources) {
    const pathItem = currentSource === 'webhook' ? getWebhookItem(spec, path) : getPathItem(spec, path)
    const operation = pathItem?.[normalizedMethod]
    if (isRecord(operation)) {
      return {
        path,
        method: normalizedMethod,
        operation: normalizeOpenApiOperationSectionId(operation, normalizedMethod, path, currentSource),
        source: currentSource,
      }
    }
  }

  return undefined
}

export function listOpenApiOperations(spec: OpenAPISpec): OpenAPIOperationEntry[] {
  const paths = spec.paths ?? {}
  const webhooks = (spec as OpenApiRecord).webhooks

  return [
    ...listOperationsFromPathItems(paths, 'path', spec),
    ...(isRecord(webhooks) ? listOperationsFromPathItems(webhooks, 'webhook', spec) : []),
  ]
}
