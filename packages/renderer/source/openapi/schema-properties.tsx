import type { ReactNode } from 'react'

import { useBuiltInText } from '../i18n'
import { Properties, Property } from '../mdx/primitives'

import { getJsonLikeContent, getResponseEntries, isRecord, isReference, resolveSchema, schemaToType } from './helpers'
import type { OpenApiParameter } from './types'
import type { OpenAPIOperation, OpenAPISpec } from './utils'

type SchemaPropertyEntry = {
  key: string
  name: string
  type?: string
  description?: string
  required: boolean
}

function getSchemaDescription(schema: Record<string, unknown>): string | undefined {
  const details = [
    Array.isArray(schema.enum) ? `enum: ${schema.enum.map(String).join(', ')}` : undefined,
    typeof schema.const !== 'undefined' ? `const: ${String(schema.const)}` : undefined,
    typeof schema.default !== 'undefined' ? `default: ${String(schema.default)}` : undefined,
    typeof schema.pattern === 'string' ? `pattern: ${schema.pattern}` : undefined,
    typeof schema.minimum === 'number' ? `minimum: ${String(schema.minimum)}` : undefined,
    typeof schema.maximum === 'number' ? `maximum: ${String(schema.maximum)}` : undefined,
    typeof schema.additionalProperties !== 'undefined' ? `additionalProperties: ${String(schema.additionalProperties)}` : undefined,
  ].filter(Boolean)
  const description = typeof schema.description === 'string' ? schema.description : undefined

  return [description, details.length > 0 ? details.join('; ') : undefined].filter(Boolean).join(' ')
}

function collectSchemaProperties(arg0: {
  spec: OpenAPISpec
  schema: unknown
  prefix?: string
  required?: string[]
  depth?: number
  seen?: Set<string>
}): SchemaPropertyEntry[] {  const {
  spec,
  schema,
  prefix = '',
  required = [],
  depth = 0,
  seen = new Set<string>(),
} = arg0

  if (depth > 4) return []
  if (isReference(schema)) {
    if (seen.has(schema.$ref)) return []
    return collectSchemaProperties({ spec, schema: resolveSchema(spec, schema), prefix, required, depth, seen: new Set([...seen, schema.$ref]) })
  }
  if (!isRecord(schema)) return []

  const composed = [...(Array.isArray(schema.allOf) ? schema.allOf : []), ...(Array.isArray(schema.oneOf) ? schema.oneOf : []), ...(Array.isArray(schema.anyOf) ? schema.anyOf : [])]
  const composedEntries = composed.flatMap((item, index) => collectSchemaProperties({
    spec,
    schema: item,
    prefix: prefix ? `${prefix}.${schema.oneOf ? `oneOf${index + 1}` : schema.anyOf ? `anyOf${index + 1}` : ''}`.replace(/\.$/, '') : '',
    required,
    depth: depth + 1,
    seen,
  }))

  const properties = isRecord(schema.properties) ? schema.properties : undefined
  const ownRequired = Array.isArray(schema.required) ? schema.required.map(String) : required
  const ownEntries = properties ? Object.entries(properties).flatMap(([name, propertySchema]) => {
    const resolvedProperty = resolveSchema(spec, propertySchema)
    const property = isRecord(resolvedProperty) ? resolvedProperty : isRecord(propertySchema) ? propertySchema : {}
    const path = prefix ? `${prefix}.${name}` : name
    const isRequired = ownRequired.includes(name)
    const isArray = isRecord(property) && property.type === 'array'
    const itemSchema = isArray ? property.items : undefined
    const nestedSchema = isArray ? resolveSchema(spec, itemSchema) : resolvedProperty
    const nestedPrefix = isArray ? `${path}[]` : path

    return [
      {
        key: path,
        name: path,
        type: schemaToType(propertySchema),
        description: getSchemaDescription(property),
        required: isRequired,
      },
      ...collectSchemaProperties({ spec, schema: nestedSchema, prefix: nestedPrefix, required: [], depth: depth + 1, seen }),
    ]
  }) : []

  return [...ownEntries, ...composedEntries]
}

export function SchemaProperties(arg0: { title: string; schema: unknown; spec: OpenAPISpec }): ReactNode {  const { title, schema, spec } = arg0

  const t = useBuiltInText()
  const entries = collectSchemaProperties({ spec, schema })

  if (entries.length === 0) return null

  return (
    <div>
      <h3>{title}</h3>
      <Properties>
        {entries.map((entry) => {
          const type = entry.required && entry.type ? `${entry.type}, ${t('openapi.requiredBadge')}` : entry.type

          return (
            <Property key={entry.key} name={entry.name} type={type}>
              {entry.description || (entry.required ? t('openapi.required') : t('openapi.optional'))}
            </Property>
          )
        })}
      </Properties>
    </div>
  )
}

export function ParameterList(arg0: { title: string; parameters: OpenApiParameter[] }): ReactNode {  const { title, parameters } = arg0

  const t = useBuiltInText()
  if (parameters.length === 0) return null

  return (
    <div>
      <h3>{title}</h3>
      <Properties>
        {parameters.map((parameter) => (
          <Property
            key={`${parameter.in}-${parameter.name}`}
            name={parameter.name ?? t('openapi.parameter')}
            type={[schemaToType(parameter.schema), parameter.required ? t('openapi.requiredBadge') : undefined].filter(Boolean).join(', ') || undefined}
          >
            {parameter.description ?? t('openapi.operationParameter')}
          </Property>
        ))}
      </Properties>
    </div>
  )
}

export function ResponseList(arg0: { operation: OpenAPIOperation }): ReactNode {  const { operation } = arg0

  const t = useBuiltInText()
  const responses = getResponseEntries(operation)
  if (responses.length === 0) return null

  return (
    <div>
      <h3>{t('openapi.responses')}</h3>
      <Properties>
        {responses.map(({ status, response }) => {
          const content = getJsonLikeContent(response.content)
          const type = schemaToType(content?.value.schema)

          return (
            <Property key={status} name={status} type={type}>
              {response.description ?? `${t('openapi.response')}.`}
            </Property>
          )
        })}
      </Properties>
    </div>
  )
}
