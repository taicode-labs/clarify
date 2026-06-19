import clsx from 'clsx'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { useBuiltInText } from '../i18n'
import { Properties, Property } from '../mdx/primitives'

import { getJsonLikeContent, getResponseEntries, isRecord, isReference, resolveReferenceName, resolveSchema, schemaToType } from './helpers'
import type { OpenApiParameter } from './types'
import type { OpenAPIOperation, OpenAPISpec } from './utils'

type SchemaTreeNode = {
  key: string
  name: string
  type?: string
  description?: string
  required: boolean
  children: SchemaTreeNode[]
}

type SchemaTreeBranch = {
  label: string
  schema: unknown
}

function getSchemaDescription(schema: Record<string, unknown>): string | undefined {
  const details = [
    Array.isArray(schema.enum) ? `enum: ${schema.enum.map(String).join(', ')}` : undefined,
    typeof schema.const !== 'undefined' ? `const: ${String(schema.const)}` : undefined,
    typeof schema.default !== 'undefined' ? `default: ${String(schema.default)}` : undefined,
    typeof schema.pattern === 'string' ? `pattern: ${schema.pattern}` : undefined,
    typeof schema.minimum === 'number' ? `minimum: ${String(schema.minimum)}` : undefined,
    typeof schema.maximum === 'number' ? `maximum: ${String(schema.maximum)}` : undefined,
    typeof schema.additionalProperties === 'boolean' ? `additionalProperties: ${String(schema.additionalProperties)}` : undefined,
  ].filter(Boolean)
  const description = typeof schema.description === 'string' ? schema.description : undefined

  return [description, details.length > 0 ? details.join('; ') : undefined].filter(Boolean).join(' ')
}

function getComposedBranches(schema: Record<string, unknown>): SchemaTreeBranch[] {
  const entries: SchemaTreeBranch[] = []

  for (const key of ['allOf', 'oneOf', 'anyOf'] as const) {
    const items = schema[key]
    if (!Array.isArray(items)) continue

    for (const [index, item] of items.entries()) {
      entries.push({ label: `${key}[${index}]`, schema: item })
    }
  }

  return entries
}

function getSchemaChildren(arg0: {
  spec: OpenAPISpec
  schema: unknown
  path: string
  required?: string[]
  depth?: number
  seen?: Set<string>
}): SchemaTreeNode[] {  const {
  spec,
  schema,
  path,
  required = [],
  depth = 0,
  seen = new Set<string>(),
} = arg0

  if (depth > 12) return []

  if (isReference(schema)) {
    if (seen.has(schema.$ref)) return []
    return getSchemaChildren({
      spec,
      schema: resolveSchema(spec, schema),
      path,
      required,
      depth,
      seen: new Set([...seen, schema.$ref]),
    })
  }

  if (!isRecord(schema)) return []

  const arrayChildren = schema.type === 'array'
    ? getSchemaChildren({ spec, schema: schema.items, path: `${path}[]`, depth: depth + 1, seen })
    : []

  const objectRequired = Array.isArray(schema.required) ? schema.required.map(String) : required
  const properties = isRecord(schema.properties) ? schema.properties : {}
  const propertyChildren = Object.entries(properties).map(([name, propertySchema]) => {
    const resolvedProperty = resolveSchema(spec, propertySchema)
    const property = isRecord(resolvedProperty) ? resolvedProperty : isRecord(propertySchema) ? propertySchema : {}
    const isArray = isRecord(property) && property.type === 'array'
    const childPath = path ? `${path}.${name}` : name
    const children = getSchemaChildren({
      spec,
      schema: isArray ? property.items : propertySchema,
      path: isArray ? `${childPath}[]` : childPath,
      depth: depth + 1,
      seen,
    })

    return {
      key: childPath,
      name,
      type: schemaToType(propertySchema),
      description: getSchemaDescription(property),
      required: objectRequired.includes(name),
      children,
    }
  })

  const additionalPropertyChildren = isRecord(schema.additionalProperties)
    ? [{
        key: `${path || 'root'}.*`,
        name: '*',
        type: schemaToType(schema.additionalProperties),
        description: getSchemaDescription(schema.additionalProperties),
        required: false,
        children: getSchemaChildren({ spec, schema: schema.additionalProperties, path: `${path || 'root'}.*`, depth: depth + 1, seen }),
      }]
    : []

  const composedChildren = getComposedBranches(schema).map(({ label, schema: branchSchema }) => ({
    key: `${path || 'root'}.${label}`,
    name: label,
    type: schemaToType(branchSchema),
    description: isRecord(resolveSchema(spec, branchSchema)) ? getSchemaDescription(resolveSchema(spec, branchSchema) as Record<string, unknown>) : undefined,
    required: false,
    children: getSchemaChildren({ spec, schema: branchSchema, path: `${path || 'root'}.${label}`, required: objectRequired, depth: depth + 1, seen }),
  }))

  return [...arrayChildren, ...propertyChildren, ...additionalPropertyChildren, ...composedChildren]
}

function getRootSchemaNode(spec: OpenAPISpec, schema: unknown): SchemaTreeNode | undefined {
  if (isReference(schema)) {
    const resolvedSchema = resolveSchema(spec, schema)
    const resolved = isRecord(resolvedSchema) ? resolvedSchema : {}

    return {
      key: schema.$ref,
      name: resolveReferenceName(schema.$ref),
      type: schemaToType(schema),
      description: getSchemaDescription(resolved),
      required: false,
      children: getSchemaChildren({ spec, schema: resolvedSchema, path: resolveReferenceName(schema.$ref), seen: new Set([schema.$ref]) }),
    }
  }

  if (!isRecord(schema)) return undefined

  return {
    key: 'root',
    name: 'body',
    type: schemaToType(schema),
    description: getSchemaDescription(schema),
    required: false,
    children: getSchemaChildren({ spec, schema, path: '' }),
  }
}

function SchemaNode(arg0: { node: SchemaTreeNode; depth?: number }): ReactNode {  const { node, depth = 0 } = arg0

  const t = useBuiltInText()
  const [expanded, setExpanded] = useState(depth < 1)
  const hasChildren = node.children.length > 0
  const type = [node.type, node.required ? t('openapi.requiredBadge') : undefined].filter(Boolean).join(', ') || undefined
  const description = node.description || (node.required ? t('openapi.required') : t('openapi.optional'))
  const rowClassName = clsx(
    'flex min-w-0 items-start rounded py-0.5 text-left',
    depth > 0 ? '-mx-2 w-[calc(100%+1rem)] px-2' : 'w-full px-1',
  )

  const content = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-semibold text-zinc-950 dark:text-white">{node.name}</span>
          {type ? <span className="font-mono text-xs text-(--clarify-theme-tokens-colors-muted) dark:text-zinc-500">{type}</span> : null}
        </div>
        {description ? <div className="mt-0.5 text-sm/5 text-zinc-600 dark:text-zinc-400">{description}</div> : null}
      </div>
      {hasChildren ? (
        <span className="ml-2 flex h-5 w-5 flex-none items-center justify-center text-zinc-500 dark:text-zinc-400" aria-hidden="true">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
      ) : null}
    </>
  )

  return (
    <li className="clarify-schema-node m-0 px-0 py-2 first:pt-0 last:pb-0">
      {hasChildren ? (
        <button
          type="button"
          aria-label={expanded ? t('openapi.collapse') : t('openapi.expand')}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className={clsx(rowClassName, 'cursor-pointer transition')}
        >
          {content}
        </button>
      ) : (
        <div className={rowClassName}>{content}</div>
      )}
      {hasChildren && expanded ? <SchemaTree nodes={node.children} depth={depth + 1} /> : null}
    </li>
  )
}

function SchemaTree(arg0: { nodes: SchemaTreeNode[]; depth?: number }): ReactNode {  const { nodes, depth = 0 } = arg0

  if (nodes.length === 0) return null

  return (
    <ul
      role="list"
      className={clsx(
        'm-0 list-none divide-y divide-zinc-900/5 p-0 dark:divide-white/5',
        depth > 0 && 'mt-2 rounded-lg bg-zinc-950/[0.025] px-2 py-1 dark:bg-white/[0.04]',
      )}
    >
      {nodes.map((node) => <SchemaNode key={node.key} node={node} depth={depth} />)}
    </ul>
  )
}

export function SchemaProperties(arg0: { title: string; schema: unknown; spec: OpenAPISpec }): ReactNode {  const { title, schema, spec } = arg0

  const root = getRootSchemaNode(spec, schema)

  if (!root || root.children.length === 0) return null

  return (
    <div>
      <h3>{title}</h3>
      <div className="clarify-schema-properties my-6">
        <SchemaTree nodes={root.children} />
      </div>
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
