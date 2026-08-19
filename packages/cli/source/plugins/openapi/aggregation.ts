import type { OpenAPISpec } from '../../types.js'

export type OpenAPISourceDocument = {
  id: string
  filePath: string
  document: OpenAPISpec
}

export type OpenAPIAggregationInfo = {
  title: string
  description: string
  version?: string
}

function mergeOpenAPIRecord(target: Record<string, unknown>, source: Record<string, unknown> | undefined, section: string, filePath: string): void {
  if (!source) return

  for (const [key, value] of Object.entries(source)) {
    const existing = target[key]
    if (existing !== undefined && JSON.stringify(existing) !== JSON.stringify(value)) {
      throw new Error(`[clarify] Cannot aggregate OpenAPI specs: conflicting ${section} entry "${key}" in ${filePath}.`)
    }
    target[key] = value
  }
}

function openAPIVersionFamily(version: string): string {
  return version.split('.').slice(0, 2).join('.')
}

const OPENAPI_OPERATION_METHODS = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'])

function sourceComponentPrefix(source: OpenAPISourceDocument): string {
  const sourceName = source.id || source.filePath.split(/[\\/]/).pop()?.replace(/\.openapi\.(?:json|ya?ml)$/i, '') || 'service'
  return sourceName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'service'
}

function securitySchemeNameMap(source: OpenAPISourceDocument, sourceSchemes: Record<string, unknown>, targetSchemes: Record<string, unknown>): Map<string, string> {
  const names = new Map<string, string>()

  for (const [name, definition] of Object.entries(sourceSchemes)) {
    const existing = targetSchemes[name]
    if (existing === undefined || JSON.stringify(existing) === JSON.stringify(definition)) {
      targetSchemes[name] = definition
      names.set(name, name)
      continue
    }

    const prefix = sourceComponentPrefix(source)
    let candidate = `${prefix}__${name}`
    let suffix = 2
    while (targetSchemes[candidate] !== undefined && JSON.stringify(targetSchemes[candidate]) !== JSON.stringify(definition)) {
      candidate = `${prefix}__${name}_${suffix++}`
    }
    targetSchemes[candidate] = definition
    names.set(name, candidate)
  }

  return names
}

function rewriteSecurityRequirements(value: unknown, schemeNames: Map<string, string>): unknown {
  if (!Array.isArray(value)) return value
  return value.map((requirement) => {
    if (!requirement || typeof requirement !== 'object' || Array.isArray(requirement)) return requirement
    return Object.fromEntries(Object.entries(requirement).map(([name, scopes]) => [schemeNames.get(name) ?? name, scopes]))
  })
}

function localizePathItemContext(pathItemValue: unknown, documentServers: unknown, documentSecurity: unknown, hasDocumentSecurity: boolean, schemeNames: Map<string, string>): unknown {
  if (!pathItemValue || typeof pathItemValue !== 'object' || Array.isArray(pathItemValue)) return pathItemValue
  const pathItem = structuredClone(pathItemValue) as Record<string, unknown>
  const pathServers = Object.hasOwn(pathItem, 'servers') ? pathItem.servers : documentServers

  for (const [method, operationValue] of Object.entries(pathItem)) {
    if (!OPENAPI_OPERATION_METHODS.has(method) || !operationValue || typeof operationValue !== 'object' || Array.isArray(operationValue)) continue
    const operation = operationValue as Record<string, unknown>

    if (!Object.hasOwn(operation, 'servers') && pathServers !== undefined) operation.servers = structuredClone(pathServers)
    if (Object.hasOwn(operation, 'security')) {
      operation.security = rewriteSecurityRequirements(operation.security, schemeNames)
    }
    else if (hasDocumentSecurity) {
      operation.security = rewriteSecurityRequirements(structuredClone(documentSecurity), schemeNames)
    }
  }

  delete pathItem.servers
  return pathItem
}

function localizeOpenAPIContexts(spec: OpenAPISpec, schemeNames: Map<string, string>): { paths: Record<string, unknown>, webhooks?: Record<string, unknown> } {
  const document = spec as unknown as Record<string, unknown>
  const hasDocumentSecurity = Object.hasOwn(document, 'security')
  const localizeEntries = (entries: Record<string, unknown> | undefined): Record<string, unknown> | undefined => entries && Object.fromEntries(
    Object.entries(entries).map(([name, pathItem]) => [name, localizePathItemContext(pathItem, document.servers, document.security, hasDocumentSecurity, schemeNames)]),
  )

  return {
    paths: localizeEntries(spec.paths as Record<string, unknown>) ?? {},
    webhooks: localizeEntries('webhooks' in spec ? spec.webhooks as Record<string, unknown> : undefined),
  }
}

export function aggregateOpenAPISources(sources: OpenAPISourceDocument[], info: OpenAPIAggregationInfo): OpenAPISpec {
  const paths: Record<string, unknown> = {}
  const webhooks: Record<string, unknown> = {}
  const components: Record<string, Record<string, unknown>> = {}
  const tags = new Map<string, unknown>()
  let openapiVersion: string | undefined

  for (const source of sources) {
    const { document: spec, filePath } = source

    if (openapiVersion && openAPIVersionFamily(openapiVersion) !== openAPIVersionFamily(spec.openapi)) {
      throw new Error(`[clarify] Cannot aggregate OpenAPI specs: incompatible versions "${openapiVersion}" and "${spec.openapi}" in ${filePath}.`)
    }
    openapiVersion ??= spec.openapi

    components.securitySchemes ??= {}
    const sourceComponents = spec.components as Record<string, Record<string, unknown>> | undefined
    const schemeNames = securitySchemeNameMap(source, sourceComponents?.securitySchemes ?? {}, components.securitySchemes)
    const localized = localizeOpenAPIContexts(spec, schemeNames)
    mergeOpenAPIRecord(paths, localized.paths, 'paths', filePath)
    mergeOpenAPIRecord(webhooks, localized.webhooks, 'webhooks', filePath)

    for (const [section, entries] of Object.entries(sourceComponents ?? {})) {
      if (section === 'securitySchemes') continue
      components[section] ??= {}
      mergeOpenAPIRecord(components[section], entries, `components.${section}`, filePath)
    }

    for (const tag of spec.tags ?? []) {
      const existing = tags.get(tag.name)
      if (existing !== undefined && JSON.stringify(existing) !== JSON.stringify(tag)) {
        throw new Error(`[clarify] Cannot aggregate OpenAPI specs: conflicting tag "${tag.name}" in ${filePath}.`)
      }
      tags.set(tag.name, tag)
    }
  }

  if (components.securitySchemes && Object.keys(components.securitySchemes).length === 0) delete components.securitySchemes

  return {
    openapi: openapiVersion ?? '3.1.0',
    info: {
      title: info.title,
      description: info.description,
      version: info.version ?? '1.0.0',
    },
    paths,
    ...(Object.keys(webhooks).length > 0 ? { webhooks } : {}),
    ...(Object.keys(components).length > 0 ? { components } : {}),
    ...(tags.size > 0 ? { tags: [...tags.values()] } : {}),
  } as OpenAPISpec
}
