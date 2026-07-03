import clsx from 'clsx'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Tabs } from '../../components'
import { useBuiltInText } from '../../core/i18n'
import { Markdown } from '../../mdx/Markdown'
import { Properties, Property } from '../../mdx/primitives'
import { getJsonLikeContent, getResponseEntries, isRecord, isReference, resolveReferenceName, resolveSchema, schemaHasType, schemaToType } from '../lib/helpers'
import type { OpenAPIOperation, OpenAPISpec } from '../lib/utils'
import type { OpenApiParameter } from '../types'

type SchemaTreeNode = {
  key: string
  name: string
  type?: string
  description?: string
  details?: string
  required: boolean
  children: SchemaTreeNode[]
}

type SchemaTreeBranch = {
  label: string
  schema: unknown
}

function getSchemaDetails(schema: Record<string, unknown>): string | undefined {
  const details = [
    Array.isArray(schema.enum) ? `enum: ${schema.enum.map(String).join(', ')}` : undefined,
    typeof schema.const !== 'undefined' ? `const: ${String(schema.const)}` : undefined,
    typeof schema.default !== 'undefined' ? `default: ${String(schema.default)}` : undefined,
    typeof schema.pattern === 'string' ? `pattern: ${schema.pattern}` : undefined,
    typeof schema.minimum === 'number' ? `minimum: ${String(schema.minimum)}` : undefined,
    typeof schema.maximum === 'number' ? `maximum: ${String(schema.maximum)}` : undefined,
    typeof schema.additionalProperties === 'boolean' ? `additionalProperties: ${String(schema.additionalProperties)}` : undefined,
  ].filter(Boolean)

  return details.length > 0 ? details.join('; ') : undefined
}

function getSchemaDescription(schema: Record<string, unknown>): string | undefined {
  return typeof schema.description === 'string' ? schema.description : undefined
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

type GetSchemaChildrenArgs = {
  spec: OpenAPISpec
  schema: unknown
  path: string
  required?: string[]
  depth?: number
  seen?: Set<string>
}

function getSchemaChildren(arg0: GetSchemaChildrenArgs): SchemaTreeNode[] {  const {
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

  const arrayChildren = schemaHasType(schema, 'array')
    ? getSchemaChildren({ spec, schema: schema.items, path: `${path}[]`, depth: depth + 1, seen })
    : []

  const objectRequired = Array.isArray(schema.required) ? schema.required.map(String) : required
  const properties = isRecord(schema.properties) ? schema.properties : {}
  const propertyChildren = Object.entries(properties).map(([name, propertySchema]) => {
    const resolvedProperty = resolveSchema(spec, propertySchema)
    const property = isRecord(resolvedProperty) ? resolvedProperty : isRecord(propertySchema) ? propertySchema : {}
    const isArray = schemaHasType(property, 'array')
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
      details: getSchemaDetails(property),
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
        details: getSchemaDetails(schema.additionalProperties),
        required: false,
        children: getSchemaChildren({ spec, schema: schema.additionalProperties, path: `${path || 'root'}.*`, depth: depth + 1, seen }),
      }]
    : []

  const composedChildren = getComposedBranches(schema).map(({ label, schema: branchSchema }) => {
    const resolvedBranch = resolveSchema(spec, branchSchema)
    const branch = isRecord(resolvedBranch) ? resolvedBranch : undefined

    return {
      key: `${path || 'root'}.${label}`,
      name: label,
      type: schemaToType(branchSchema),
      description: branch ? getSchemaDescription(branch) : undefined,
      details: branch ? getSchemaDetails(branch) : undefined,
      required: false,
      children: getSchemaChildren({ spec, schema: branchSchema, path: `${path || 'root'}.${label}`, required: objectRequired, depth: depth + 1, seen }),
    }
  })

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
      details: getSchemaDetails(resolved),
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
    details: getSchemaDetails(schema),
    required: false,
    children: getSchemaChildren({ spec, schema, path: '' }),
  }
}

type SchemaNodeProps = { node: SchemaTreeNode; depth?: number }

function SchemaNode(arg0: SchemaNodeProps): ReactNode {  const { node, depth = 0 } = arg0

  const t = useBuiltInText()
  const [expanded, setExpanded] = useState(depth < 1)
  const hasChildren = node.children.length > 0
  const type = [node.type, node.required ? t('openapi.requiredBadge') : undefined].filter(Boolean).join(', ') || undefined
  const fallbackDescription = node.required ? t('openapi.required') : t('openapi.optional')
  const rowClassName = clsx(
    'flex min-w-0 items-start rounded py-0.5 text-left',
    depth > 0 ? '-mx-2 w-(--clarify-schema-row-nested-width) px-2' : 'w-full px-1',
  )

  const content = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm/5 font-semibold text-(--clarify-theme-tokens-colors-foreground)">{node.name}</span>
          {type ? <span className="text-xs text-(--clarify-theme-tokens-colors-muted)">{type}</span> : null}
        </div>
        <div className="mt-0.5 text-sm/5 text-(--clarify-ui-text-soft) *:first:mt-0 *:last:mb-0">
          {node.description ? <Markdown className="*:first:mt-0 *:last:mb-0">{node.description}</Markdown> : fallbackDescription}
          {node.details ? <p className="text-xs text-(--clarify-ui-text-faint)">{node.details}</p> : null}
        </div>
      </div>
      {hasChildren ? (
        <span className="ml-2 flex h-5 w-5 flex-none items-center justify-center text-(--clarify-ui-text-faint)" aria-hidden="true">
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

type SchemaTreeProps = { nodes: SchemaTreeNode[]; depth?: number }

function SchemaTree(arg0: SchemaTreeProps): ReactNode {  const { nodes, depth = 0 } = arg0

  if (nodes.length === 0) return null

  return (
    <ul
      role="list"
      className={clsx(
        'm-0 list-none divide-y divide-(--clarify-theme-tokens-colors-border) p-0',
        depth > 0 && 'mt-2 rounded-lg bg-(--clarify-ui-subtle-background) px-2 py-1',
      )}
    >
      {nodes.map((node) => <SchemaNode key={node.key} node={node} depth={depth} />)}
    </ul>
  )
}

type SchemaPropertiesProps = { title: string; schema: unknown; spec: OpenAPISpec }

export function SchemaProperties(arg0: SchemaPropertiesProps): ReactNode {  const { title, schema, spec } = arg0

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

type ParameterListProps = { title: string; parameters: OpenApiParameter[] }

export function ParameterList(arg0: ParameterListProps): ReactNode {  const { title, parameters } = arg0

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
            {parameter.description ? <Markdown className="*:first:mt-0 *:last:mb-0">{parameter.description}</Markdown> : t('openapi.operationParameter')}
          </Property>
        ))}
      </Properties>
    </div>
  )
}

type ResponseListProps = { operation: OpenAPIOperation; spec?: OpenAPISpec; selectedStatus?: string; onSelectStatus?: (value: string) => void }

export function ResponseList(arg0: ResponseListProps): ReactNode {  const { operation, spec, selectedStatus, onSelectStatus } = arg0

  const t = useBuiltInText()
  const responses = getResponseEntries(operation, spec)
  const orderedResponses = [...responses].sort((left, right) => {
    if (left.status === 'default') return -1
    if (right.status === 'default') return 1

    const leftCode = Number(left.status)
    const rightCode = Number(right.status)

    if (!Number.isNaN(leftCode) && !Number.isNaN(rightCode)) return leftCode - rightCode
    return left.status.localeCompare(right.status)
  })
  const activeStatus = selectedStatus ?? orderedResponses.find(({ status }) => status === 'default')?.status ?? orderedResponses.find(({ status }) => status.startsWith('2'))?.status ?? orderedResponses[0]?.status ?? ''
  const selectedIndex = Math.max(0, orderedResponses.findIndex(({ status }) => status === activeStatus))

  if (orderedResponses.length === 0) return null

  const renderResponsePanel = ({ status, response }: { status: string; response: NonNullable<(typeof orderedResponses)[number]['response']> }) => {
    const content = getJsonLikeContent(response.content, spec)
    const responseSchema = content?.value.schema
    const type = schemaToType(responseSchema)

    return (
      <div className="rounded-(--clarify-theme-tokens-radius-xl) p-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm/5 font-semibold text-(--clarify-theme-tokens-colors-foreground)">{status}</span>
          {type ? <span className="text-xs text-(--clarify-theme-tokens-colors-muted)">{type}</span> : null}
        </div>
        <div className="mt-3 text-sm/6 text-(--clarify-ui-text-soft) *:first:mt-0 *:last:mb-0">
          {response.description ? <Markdown className="*:first:mt-0 *:last:mb-0">{response.description}</Markdown> : `${t('openapi.response')}.`}
        </div>
        {responseSchema && spec ? (
          <div className="mt-4">
            <SchemaProperties title={t('openapi.responseBodyProperties')} schema={responseSchema} spec={spec} />
          </div>
        ) : null}
      </div>
    )
  }

  if (orderedResponses.length === 1) {
    const [{ status, response }] = orderedResponses
    return (
      <div>
        <h3>{t('openapi.responses')}</h3>
        {renderResponsePanel({ status, response })}
      </div>
    )
  }

  return (
    <div>
      <h3>{t('openapi.responses')}</h3>
      <Tabs
        selectedIndex={selectedIndex}
        onChange={(index) => {
          onSelectStatus?.(orderedResponses[index]?.status ?? '')
        }}
        items={orderedResponses.map(({ status, response }) => ({
          id: status,
          label: status,
          panel: renderResponsePanel({ status, response }),
        }))}
        panelsClassName="mt-4"
      />
    </div>
  )
}
