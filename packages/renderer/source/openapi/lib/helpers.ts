import type { ExampleEntry, MediaTypeEntry, OpenApiMediaType, OpenApiParameter, OpenApiPathItem, OpenApiRecord, OpenApiResponse } from '../types'

import type { OpenAPIOperation, OpenAPIOperationSource, OpenAPISpec } from './utils'

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

function mergeAllOfSchemas(spec: OpenAPISpec, schemas: unknown[]): OpenApiRecord {
  const merged: OpenApiRecord = {}
  const properties: OpenApiRecord = {}
  const required = new Set<string>()

  for (const schema of schemas) {
    const resolved = resolveRequestSchema(spec, schema)
    if (!isRecord(resolved)) continue
    Object.assign(merged, resolved)
    if (isRecord(resolved.properties)) Object.assign(properties, resolved.properties)
    if (Array.isArray(resolved.required)) resolved.required.forEach((name) => required.add(String(name)))
  }

  if (Object.keys(properties).length > 0) merged.properties = properties
  if (required.size > 0) merged.required = [...required]
  delete merged.allOf
  return merged
}

export function resolveRequestSchema(spec: OpenAPISpec, schema: unknown): unknown {
  const resolved = resolveSchema(spec, schema)
  if (!isRecord(resolved)) return resolved

  const ownSchema = { ...resolved }
  const allOf = Array.isArray(ownSchema.allOf) ? ownSchema.allOf : []
  if (allOf.length === 0) return ownSchema

  delete ownSchema.allOf
  return mergeAllOfSchemas(spec, [...allOf, ownSchema])
}

export function fuzzyMatch(value: string, query: string): boolean {
  const candidate = value.toLocaleLowerCase()
  const needle = query.trim().toLocaleLowerCase()
  let candidateIndex = 0

  for (const character of needle) {
    candidateIndex = candidate.indexOf(character, candidateIndex)
    if (candidateIndex === -1) return false
    candidateIndex += 1
  }

  return true
}

const noExampleMatch = Symbol('no-example-match')

export function getSchemaSearchText(name: string, schema: unknown): string {
  if (!isRecord(schema)) return name

  return [
    name,
    schema.type,
    schema.description,
    schema.pattern,
    schema.const,
    schema.default,
    schema.minimum,
    schema.maximum,
    schema.additionalProperties,
  ].filter((value) => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean').join(' ')
}

function filterExampleValue(spec: OpenAPISpec, schema: unknown, value: unknown, query: string): unknown | typeof noExampleMatch {
  const resolved = resolveRequestSchema(spec, schema)

  if (Array.isArray(value)) {
    const itemSchema = isRecord(resolved) ? resolved.items : undefined
    const items = value
      .map((item) => filterExampleValue(spec, itemSchema, item, query))
      .filter((item) => item !== noExampleMatch)
    return items.length > 0 ? items : noExampleMatch
  }

  if (isRecord(value)) {
    const properties = isRecord(resolved) && isRecord(resolved.properties) ? resolved.properties : {}
    const filtered = Object.entries(value).flatMap(([name, propertyValue]) => {
      const propertySchema = properties[name] ?? (isRecord(resolved) && isRecord(resolved.additionalProperties) ? resolved.additionalProperties : undefined)
      if (fuzzyMatch(getSchemaSearchText(name, resolveRequestSchema(spec, propertySchema)), query)) return [[name, propertyValue] as const]

      const child = filterExampleValue(spec, propertySchema, propertyValue, query)
      return child === noExampleMatch ? [] : [[name, child] as const]
    })

    return filtered.length > 0 ? Object.fromEntries(filtered) : noExampleMatch
  }

  return fuzzyMatch(getSchemaSearchText('', resolved), query) ? value : noExampleMatch
}

export function filterExampleBySchema(spec: OpenAPISpec, schema: unknown, value: unknown, query: string): unknown {
  if (!query.trim()) return value

  const filtered = filterExampleValue(spec, schema, value, query)
  if (filtered !== noExampleMatch) return filtered
  return Array.isArray(value) ? [] : isRecord(value) ? {} : value
}

export function getRequestSchemaVariants(spec: OpenAPISpec, schema: unknown): Array<{ key: string; title: string; schema: unknown }> {
  const resolved = resolveRequestSchema(spec, schema)
  if (!isRecord(resolved)) return []
  const keyword = Array.isArray(resolved.oneOf) ? 'oneOf' : Array.isArray(resolved.anyOf) ? 'anyOf' : undefined
  if (!keyword) return []

  return (resolved[keyword] as unknown[]).map((branch, index) => {
    const branchSchema = resolveRequestSchema(spec, branch)
    const branchRecord = isRecord(branchSchema) ? branchSchema : undefined
    const referenceTitle = isReference(branch) ? resolveReferenceName(branch.$ref) : undefined
    return {
      key: `${keyword}-${index}`,
      title: typeof branchRecord?.title === 'string' ? branchRecord.title : referenceTitle ?? `${keyword}[${index}]`,
      schema: branchSchema,
    }
  })
}

export function getPathItem(spec: OpenAPISpec, path: string): OpenApiPathItem | undefined {
  return resolveObjectRef<OpenApiPathItem>(spec, spec.paths?.[path])
}

export function getOperationPathItem(spec: OpenAPISpec, path: string, source: OpenAPIOperationSource = 'path'): OpenApiPathItem | undefined {
  if (source === 'path') return getPathItem(spec, path)

  const webhooks = (spec as OpenApiRecord).webhooks
  return resolveObjectRef<OpenApiPathItem>(spec, isRecord(webhooks) ? webhooks[path] : undefined)
}

export function joinPath(base: string, path: string): string {
  if (!base) return path || '/'
  if (!path) return base

  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

function resolveObjectRef<T extends OpenApiRecord>(spec: OpenAPISpec | undefined, value: unknown): T | undefined {
  const resolved = spec && isReference(value) ? resolveOpenApiRef(spec, value.$ref) : value
  return isRecord(resolved) && !isReference(resolved) ? resolved as T : undefined
}

export function schemaHasType(schema: unknown, type: string): boolean {
  if (!isRecord(schema)) return false
  if (type === 'null' && schema.nullable === true) return true
  return schema.type === type || (Array.isArray(schema.type) && schema.type.includes(type))
}

export function getOperationParameters(spec: OpenAPISpec, path: string, operation: OpenAPIOperation, source: OpenAPIOperationSource = 'path'): OpenApiParameter[] {
  const pathParameters = getOperationPathItem(spec, path, source)?.parameters
  const operationParameters = (operation as OpenApiRecord).parameters
  const parameters = [...(Array.isArray(pathParameters) ? pathParameters : []), ...(Array.isArray(operationParameters) ? operationParameters : [])]
    .map((parameter) => resolveObjectRef<OpenApiParameter>(spec, parameter))
    .filter((parameter): parameter is OpenApiParameter => Boolean(parameter))
  const deduped = new Map<string, OpenApiParameter>()

  for (const parameter of parameters) {
    const key = parameter.name && parameter.in ? `${parameter.in}:${parameter.name}` : undefined
    if (key) deduped.set(key, parameter)
  }

  return parameters.filter((parameter) => {
    const key = parameter.name && parameter.in ? `${parameter.in}:${parameter.name}` : undefined
    return key ? deduped.get(key) === parameter : true
  })
}

export function getRequestBody(spec: OpenAPISpec, operation: OpenAPIOperation): OpenApiRecord | undefined {
  const requestBody = (operation as OpenApiRecord).requestBody
  return resolveObjectRef(spec, requestBody)
}

export function getMediaTypeEntries(content: unknown, spec?: OpenAPISpec): MediaTypeEntry[] {
  if (!isRecord(content)) return []

  return Object.entries(content)
    .map(([mediaType, value]) => ({ mediaType, value: resolveObjectRef<OpenApiMediaType>(spec, value) }))
    .filter((entry): entry is MediaTypeEntry => Boolean(entry.value))
    .sort((a, z) => {
      const aJson = a.mediaType.includes('json') ? 0 : 1
      const zJson = z.mediaType.includes('json') ? 0 : 1
      return aJson - zJson
    })
}

export function getJsonLikeContent(content: unknown, spec?: OpenAPISpec): MediaTypeEntry | undefined {
  return getMediaTypeEntries(content, spec)[0]
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

export function getExampleEntries(mediaType?: OpenApiMediaType, spec?: OpenAPISpec): ExampleEntry[] {
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

  const generated = schemaToExample(spec ? resolveRequestSchema(spec, mediaType.schema) : mediaType.schema)
  return typeof generated === 'undefined' ? [] : [{ key: 'schema', title: 'schema', value: generated, generated: true }]
}

export function getParameterExampleEntries(parameter: OpenApiParameter): ExampleEntry[] {
  if (isRecord(parameter.examples)) {
    const examples: ExampleEntry[] = []

    for (const [key, example] of Object.entries(parameter.examples)) {
      const value = getExampleValue(example)
      if (typeof value === 'undefined') continue

      const { title, summary } = getExampleTitle(key, example)
      examples.push({ key, title, summary, value })
    }

    if (examples.length > 0) return examples
  }

  return typeof parameter.example === 'undefined' ? [] : [{ key: 'default', title: 'Example', value: parameter.example }]
}

export function getRequestExampleEntries(parameters: OpenApiParameter[], mediaType?: OpenApiMediaType): ExampleEntry[] {
  const entries = new Map<string, ExampleEntry>()

  for (const example of getExampleEntries(mediaType).filter((entry) => !entry.generated)) entries.set(example.key, example)
  for (const parameter of parameters) {
    for (const example of getParameterExampleEntries(parameter)) {
      if (!entries.has(example.key)) entries.set(example.key, example)
    }
  }

  return [...entries.values()]
}

export function getContentExample(mediaType?: OpenApiMediaType): unknown {
  return getExampleEntries(mediaType)[0]?.value
}

export function schemaToType(schema: unknown): string | undefined {
  if (!isRecord(schema)) return undefined
  if (isReference(schema)) return resolveReferenceName(schema.$ref)
  if (typeof schema.const !== 'undefined') return JSON.stringify(schema.const)
  if (Array.isArray(schema.enum)) return 'enum'

  const oneOf = schema.oneOf ?? schema.anyOf
  if (Array.isArray(oneOf)) {
    return oneOf.map((branch) => schemaToType(branch)).filter(Boolean).join(' | ')
  }

  if (Array.isArray(schema.allOf)) {
    return schema.allOf.map((branch) => schemaToType(branch)).filter(Boolean).join(' & ')
  }

  if (schemaHasType(schema, 'array')) {
    return `${schemaToType(schema.items) ?? 'unknown'}[]`
  }

  const type = Array.isArray(schema.type) ? schema.type.map(String).join(' | ') : schema.type
  const nullableType = schema.nullable === true && type !== 'null' ? [type, 'null'].filter(Boolean).join(' | ') : type
  return typeof nullableType === 'string' ? [nullableType, typeof schema.format === 'string' ? `<${schema.format}>` : undefined].filter(Boolean).join('') : undefined
}

export function schemaToExample(schema: unknown, depth = 0): unknown {
  if (!isRecord(schema) || depth > 3) return undefined
  if (typeof schema.example !== 'undefined') return schema.example
  if (typeof schema.default !== 'undefined') return schema.default
  if (Array.isArray(schema.enum)) return schema.enum[0]
  if (isReference(schema)) return { id: resolveReferenceName(schema.$ref) }

  const variant = Array.isArray(schema.oneOf) ? schema.oneOf[0] : Array.isArray(schema.anyOf) ? schema.anyOf[0] : undefined
  if (typeof variant !== 'undefined') return schemaToExample(variant, depth + 1)

  if (schemaHasType(schema, 'array')) {
    return [schemaToExample(schema.items, depth + 1) ?? 'string']
  }

  if (schemaHasType(schema, 'object') || isRecord(schema.properties)) {
    const properties = isRecord(schema.properties) ? schema.properties : {}
    return Object.fromEntries(
      Object.entries(properties).filter(([, propertySchema]) => !isRecord(propertySchema) || propertySchema.readOnly !== true).slice(0, 8).map(([name, propertySchema]) => [
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

export function getResponseEntries(operation: OpenAPIOperation, spec?: OpenAPISpec): Array<{ status: string; response: OpenApiResponse }> {
  const responses = (operation as OpenApiRecord).responses
  if (!isRecord(responses)) return []

  return Object.entries(responses)
    .map(([status, response]) => ({ status, response: resolveObjectRef<OpenApiResponse>(spec, response) }))
    .filter((entry): entry is { status: string; response: OpenApiResponse } => Boolean(entry.response))
}

export function codeLanguageForMediaType(mediaType?: string): string {
  if (!mediaType) return 'json'
  if (mediaType.includes('json')) return 'json'
  if (mediaType.includes('yaml') || mediaType.includes('yml')) return 'yaml'
  if (mediaType.startsWith('text/')) return 'text'
  if (mediaType.includes('xml')) return 'xml'
  return 'text'
}
