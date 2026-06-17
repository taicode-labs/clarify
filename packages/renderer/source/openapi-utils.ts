import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

export type OpenAPISpec = OpenAPIV3.Document | OpenAPIV3_1.Document
export type OpenAPIOperation = OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject

export const OPENAPI_HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const

export type OpenAPIHttpMethod = typeof OPENAPI_HTTP_METHODS[number]

export function isOpenAPIHttpMethod(method: string): method is OpenAPIHttpMethod {
  return (OPENAPI_HTTP_METHODS as readonly string[]).includes(method.toLowerCase())
}

export function getOpenApiOperation(spec: OpenAPISpec, path: string, method: string): OpenAPIOperation | undefined {
  if (!isOpenAPIHttpMethod(method)) return undefined
  return spec.paths?.[path]?.[method.toLowerCase() as OpenAPIHttpMethod]
}

export function listOpenApiOperations(spec: OpenAPISpec): Array<{ path: string; method: OpenAPIHttpMethod; operation: OpenAPIOperation }> {
  const paths = spec.paths ?? {}
  const operations: Array<{ path: string; method: OpenAPIHttpMethod; operation: OpenAPIOperation }> = []

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue
    for (const method of OPENAPI_HTTP_METHODS) {
      const operation = pathItem[method]
      if (operation) operations.push({ path, method, operation })
    }
  }

  return operations
}
