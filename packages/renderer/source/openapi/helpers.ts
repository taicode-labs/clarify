import type { ExampleEntry, MediaTypeEntry, OpenApiMediaType, OpenApiParameter, OpenApiRecord, OpenApiResponse } from './types'
import type { OpenAPIOperation, OpenAPISpec } from './utils'

export function isRecord(value: unknown): value is OpenApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isReference(value: unknown): value is { $ref: string } {
  return isRecord(value) && typeof value.$ref === 'string'
}

export function resolveReferenceName(ref: string): string {
  return ref.split('/').filter(Boolean).at(-1) ?? ref
}

export function resolveOpenApiRef(spec: OpenAPISpec, ref: string): unknown {
  if (!ref.startsWith('#/')) return undefined

  return ref
    .slice(2)
    .split('/')
    .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce<unknown>((current, part) => (isRecord(current) ? current[part] : undefined), spec)
}

export function resolveSchema(spec: OpenAPISpec, schema: unknown, seen = new Set<string>()): unknown {
  if (!isReference(schema)) return schema
  if (seen.has(schema.$ref)) return schema

  seen.add(schema.$ref)
  return resolveSchema(spec, resolveOpenApiRef(spec, schema.$ref), seen) ?? schema
}

export function getPathItem(spec: OpenAPISpec, path: string): OpenApiRecord | undefined {
  const pathItem = spec.paths?.[path]
  return isRecord(pathItem) ? pathItem : undefined
}

export function getOperationParameters(spec: OpenAPISpec, path: string, operation: OpenAPIOperation): OpenApiParameter[] {
  const pathParameters = getPathItem(spec, path)?.parameters
  const operationParameters = (operation as OpenApiRecord).parameters

  return [...(Array.isArray(pathParameters) ? pathParameters : []), ...(Array.isArray(operationParameters) ? operationParameters : [])]
    .filter((parameter): parameter is OpenApiParameter => isRecord(parameter) && !isReference(parameter))
}

export function getRequestBody(operation: OpenAPIOperation): OpenApiRecord | undefined {
  const requestBody = (operation as OpenApiRecord).requestBody
  return isRecord(requestBody) && !isReference(requestBody) ? requestBody : undefined
}

export function getMediaTypeEntries(content: unknown): MediaTypeEntry[] {
  if (!isRecord(content)) return []

  return Object.entries(content)
    .filter(([, value]) => isRecord(value) && !isReference(value))
    .map(([mediaType, value]) => ({ mediaType, value: value as OpenApiMediaType }))
    .sort((a, z) => {
      const aJson = a.mediaType.includes('json') ? 0 : 1
      const zJson = z.mediaType.includes('json') ? 0 : 1
      return aJson - zJson
    })
}

export function getJsonLikeContent(content: unknown): MediaTypeEntry | undefined {
  return getMediaTypeEntries(content)[0]
}

function getExampleValue(example: unknown): unknown {
  if (isRecord(example) && 'value' in example) return example.value
  if (isRecord(example) && 'externalValue' in example) return undefined
  return example
}

function getExampleTitle(key: string, example: unknown): { title: string; summary?: string } {
  if (isRecord(example)) {
    const summary = typeof example.summary === 'string' ? example.summary : undefined
    return { title: summary ?? key, summary }
  }

  return { title: key }
}

export function getExampleEntries(mediaType?: OpenApiMediaType): ExampleEntry[] {
  if (!mediaType) return []

  if (isRecord(mediaType.examples)) {
    const examples: ExampleEntry[] = []

    for (const [key, example] of Object.entries(mediaType.examples)) {
      const value = getExampleValue(example)
      if (typeof value === 'undefined') continue

      const { title, summary } = getExampleTitle(key, example)
      examples.push({ key, title, summary, value })
    }

    if (examples.length > 0) return examples
  }

  if (typeof mediaType.example !== 'undefined') {
    return [{ key: 'default', title: 'Example', value: mediaType.example }]
  }

  const generated = schemaToExample(mediaType.schema)
  return typeof generated === 'undefined' ? [] : [{ key: 'schema', title: 'schema', value: generated, generated: true }]
}

export function getContentExample(mediaType?: OpenApiMediaType): unknown {
  return getExampleEntries(mediaType)[0]?.value
}

export function schemaToType(schema: unknown): string | undefined {
  if (!isRecord(schema)) return undefined
  if (isReference(schema)) return resolveReferenceName(schema.$ref)
  if (typeof schema.const !== 'undefined') return JSON.stringify(schema.const)
  if (Array.isArray(schema.enum)) return schema.enum.map(String).join(' | ')

  const oneOf = schema.oneOf ?? schema.anyOf
  if (Array.isArray(oneOf)) {
    return oneOf.map(schemaToType).filter(Boolean).join(' | ')
  }

  if (Array.isArray(schema.allOf)) {
    return schema.allOf.map(schemaToType).filter(Boolean).join(' & ')
  }

  if (schema.type === 'array') {
    return `${schemaToType(schema.items) ?? 'unknown'}[]`
  }

  const type = Array.isArray(schema.type) ? schema.type.map(String).join(' | ') : schema.type
  return typeof type === 'string' ? [type, typeof schema.format === 'string' ? `<${schema.format}>` : undefined].filter(Boolean).join('') : undefined
}

export function schemaToExample(schema: unknown, depth = 0): unknown {
  if (!isRecord(schema) || depth > 3) return undefined
  if (typeof schema.example !== 'undefined') return schema.example
  if (typeof schema.default !== 'undefined') return schema.default
  if (Array.isArray(schema.enum)) return schema.enum[0]
  if (isReference(schema)) return { id: resolveReferenceName(schema.$ref) }

  if (schema.type === 'array') {
    return [schemaToExample(schema.items, depth + 1) ?? 'string']
  }

  if (schema.type === 'object' || isRecord(schema.properties)) {
    const properties = isRecord(schema.properties) ? schema.properties : {}
    return Object.fromEntries(
      Object.entries(properties).slice(0, 8).map(([name, propertySchema]) => [
        name,
        schemaToExample(propertySchema, depth + 1) ?? exampleForType(schemaToType(propertySchema)),
      ]),
    )
  }

  return exampleForType(schemaToType(schema))
}

function exampleForType(type?: string): unknown {
  if (!type) return 'string'
  if (type.endsWith('[]')) return []
  if (type.includes('integer') || type.includes('number')) return 42
  if (type.includes('boolean')) return true
  if (type.includes('object')) return {}
  return 'string'
}

export function stringifyExample(value: unknown): string {
  if (typeof value === 'undefined') return ''
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

export function getResponseEntries(operation: OpenAPIOperation): Array<{ status: string; response: OpenApiResponse }> {
  const responses = (operation as OpenApiRecord).responses
  if (!isRecord(responses)) return []

  return Object.entries(responses)
    .filter(([, response]) => isRecord(response) && !isReference(response))
    .map(([status, response]) => ({ status, response: response as OpenApiResponse }))
}

export function codeLanguageForMediaType(mediaType?: string): string {
  if (!mediaType) return 'json'
  if (mediaType.includes('json')) return 'json'
  if (mediaType.includes('yaml') || mediaType.includes('yml')) return 'yaml'
  if (mediaType.startsWith('text/')) return 'text'
  if (mediaType.includes('xml')) return 'xml'
  return 'text'
}
