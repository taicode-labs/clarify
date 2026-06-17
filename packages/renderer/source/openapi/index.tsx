import { slug } from 'github-slugger'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { Code, CodeGroup, Heading, Prose } from '../components'
import { useOpenApiSpecs } from '../context'
import { Col, Properties, Property, Row } from '../mdx/primitives'
import { getOpenApiOperation, listOpenApiOperations } from './utils'
import type { OpenAPIOperation, OpenAPISpec } from './utils'

export type { OpenAPIOperation, OpenAPISpec } from './utils'

export type OpenApiPageProps = {
  spec?: OpenAPISpec
  specPath?: string
}

export type ApiEndpointProps = {
  spec: OpenAPISpec
  path: string
  method: string
}

export type OpenApiEndpointProps = {
  specPath: string
  path: string
  method: string
}

type OpenApiRecord = Record<string, unknown>

type OpenApiParameter = {
  name?: string
  in?: string
  required?: boolean
  description?: string
  schema?: unknown
}

type OpenApiMediaType = {
  schema?: unknown
  example?: unknown
  examples?: Record<string, unknown>
}

type OpenApiResponse = {
  description?: string
  content?: Record<string, OpenApiMediaType>
}

const VIRTUAL_PREFIX = 'virtual:clarify-page/'

function isRecord(value: unknown): value is OpenApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isReference(value: unknown): value is { $ref: string } {
  return isRecord(value) && typeof value.$ref === 'string'
}

function resolveReferenceName(ref: string): string {
  return ref.split('/').filter(Boolean).at(-1) ?? ref
}

function getPathItem(spec: OpenAPISpec, path: string): OpenApiRecord | undefined {
  const pathItem = spec.paths?.[path]
  return isRecord(pathItem) ? pathItem : undefined
}

function getOperationParameters(spec: OpenAPISpec, path: string, operation: OpenAPIOperation): OpenApiParameter[] {
  const pathParameters = getPathItem(spec, path)?.parameters
  const operationParameters = (operation as OpenApiRecord).parameters

  return [...(Array.isArray(pathParameters) ? pathParameters : []), ...(Array.isArray(operationParameters) ? operationParameters : [])]
    .filter((parameter): parameter is OpenApiParameter => isRecord(parameter) && !isReference(parameter))
}

function getRequestBody(operation: OpenAPIOperation): OpenApiRecord | undefined {
  const requestBody = (operation as OpenApiRecord).requestBody
  return isRecord(requestBody) && !isReference(requestBody) ? requestBody : undefined
}

function getJsonLikeContent(content: unknown): { mediaType: string; value: OpenApiMediaType } | undefined {
  if (!isRecord(content)) return undefined

  for (const [mediaType, value] of Object.entries(content)) {
    if (mediaType.includes('json') && isRecord(value)) return { mediaType, value }
  }

  const [mediaType, value] = Object.entries(content)[0] ?? []
  return mediaType && isRecord(value) ? { mediaType, value } : undefined
}

function getContentExample(mediaType?: OpenApiMediaType): unknown {
  if (!mediaType) return undefined
  if (typeof mediaType.example !== 'undefined') return mediaType.example

  const examples = isRecord(mediaType.examples) ? Object.values(mediaType.examples) : []
  for (const example of examples) {
    if (isRecord(example) && 'value' in example) return example.value
    if (typeof example !== 'undefined') return example
  }

  return schemaToExample(mediaType.schema)
}

function schemaToType(schema: unknown): string | undefined {
  if (!isRecord(schema)) return undefined
  if (isReference(schema)) return resolveReferenceName(schema.$ref)
  if (Array.isArray(schema.enum)) return schema.enum.map(String).join(' | ')

  const oneOf = schema.oneOf ?? schema.anyOf
  if (Array.isArray(oneOf)) {
    return oneOf.map(schemaToType).filter(Boolean).join(' | ')
  }

  if (schema.type === 'array') {
    return `${schemaToType(schema.items) ?? 'unknown'}[]`
  }

  return typeof schema.type === 'string' ? schema.type : undefined
}

function schemaToExample(schema: unknown, depth = 0): unknown {
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

function stringifyExample(value: unknown): string {
  if (typeof value === 'undefined') return ''
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`
}

function getServerUrl(spec: OpenAPISpec): string {
  const servers = (spec as OpenApiRecord).servers
  if (!Array.isArray(servers)) return ''

  const firstServer = servers.find(isRecord)
  return typeof firstServer?.url === 'string' ? firstServer.url : ''
}

function buildOperationUrl(spec: OpenAPISpec, path: string, parameters: OpenApiParameter[]): string {
  const query = parameters
    .filter((parameter) => parameter.in === 'query' && parameter.name)
    .map((parameter) => `${parameter.name}={${parameter.name}}`)
    .join('&')
  const serverUrl = getServerUrl(spec).replace(/\/$/, '')
  return `${serverUrl}${path}${query ? `?${query}` : ''}`
}

function buildCurlExample({
  spec,
  path,
  method,
  parameters,
  requestContent,
}: {
  spec: OpenAPISpec
  path: string
  method: string
  parameters: OpenApiParameter[]
  requestContent?: { mediaType: string; value: OpenApiMediaType }
}): string {
  const url = buildOperationUrl(spec, path, parameters)
  const lines = [`curl ${method === 'GET' ? '-G ' : ''}${shellQuote(url)}`]

  if (method !== 'GET') lines.push(`  -X ${method}`)
  lines.push("  -H 'Authorization: Bearer {token}'")
  lines.push("  -H 'Accept: application/json'")

  const requestExample = getContentExample(requestContent?.value)
  if (requestContent && typeof requestExample !== 'undefined') {
    lines.push(`  -H 'Content-Type: ${requestContent.mediaType}'`)
    lines.push(`  -d ${shellQuote(stringifyExample(requestExample))}`)
  }

  return lines.join(' \\\n')
}

function getResponseEntries(operation: OpenAPIOperation): Array<{ status: string; response: OpenApiResponse }> {
  const responses = (operation as OpenApiRecord).responses
  if (!isRecord(responses)) return []

  return Object.entries(responses)
    .filter(([, response]) => isRecord(response) && !isReference(response))
    .map(([status, response]) => ({ status, response: response as OpenApiResponse }))
}

function getPrimaryResponse(operation: OpenAPIOperation): { status: string; response: OpenApiResponse; content?: { mediaType: string; value: OpenApiMediaType } } | undefined {
  const responses = getResponseEntries(operation)
  const successful = responses.find(({ status }) => status.startsWith('2')) ?? responses[0]
  if (!successful) return undefined

  return {
    ...successful,
    content: getJsonLikeContent(successful.response.content),
  }
}

function SchemaProperties({ title, schema }: { title: string; schema: unknown }): ReactNode {
  const targetSchema = isReference(schema) ? undefined : schema
  const properties = isRecord(targetSchema) && isRecord(targetSchema.properties) ? targetSchema.properties : undefined
  const required = isRecord(targetSchema) && Array.isArray(targetSchema.required) ? targetSchema.required.map(String) : []

  if (!properties || Object.keys(properties).length === 0) return null

  return (
    <div>
      <h3>{title}</h3>
      <Properties>
        {Object.entries(properties).map(([name, propertySchema]) => {
          const property = isRecord(propertySchema) ? propertySchema : {}
          const type = schemaToType(propertySchema)
          const description = typeof property.description === 'string' ? property.description : undefined
          const isRequired = required.includes(name)

          return (
            <Property key={name} name={name} type={isRequired && type ? `${type}, required` : type}>
              {description ?? (isRequired ? 'Required.' : 'Optional.')}
            </Property>
          )
        })}
      </Properties>
    </div>
  )
}

function ParameterList({ title, parameters }: { title: string; parameters: OpenApiParameter[] }): ReactNode {
  if (parameters.length === 0) return null

  return (
    <div>
      <h3>{title}</h3>
      <Properties>
        {parameters.map((parameter) => (
          <Property
            key={`${parameter.in}-${parameter.name}`}
            name={parameter.name ?? 'parameter'}
            type={[schemaToType(parameter.schema), parameter.required ? 'required' : undefined].filter(Boolean).join(', ') || undefined}
          >
            {parameter.description ?? `${parameter.in ?? 'Operation'} parameter.`}
          </Property>
        ))}
      </Properties>
    </div>
  )
}

function ResponseList({ operation }: { operation: OpenAPIOperation }): ReactNode {
  const responses = getResponseEntries(operation)
  if (responses.length === 0) return null

  return (
    <div>
      <h3>Responses</h3>
      <Properties>
        {responses.map(({ status, response }) => {
          const content = getJsonLikeContent(response.content)
          const type = schemaToType(content?.value.schema)

          return (
            <Property key={status} name={status} type={type}>
              {response.description ?? 'Response.'}
            </Property>
          )
        })}
      </Properties>
    </div>
  )
}

function CodeBlock({ code, language, title }: { code: string; language: string; title: string }): ReactNode {
  return (
    <Code code={code} language={language} title={title}>
      {escapeHtml(code)}
    </Code>
  )
}

function EndpointExamples({
  spec,
  path,
  method,
  operation,
  parameters,
  requestContent,
}: {
  spec: OpenAPISpec
  path: string
  method: string
  operation: OpenAPIOperation
  parameters: OpenApiParameter[]
  requestContent?: { mediaType: string; value: OpenApiMediaType }
}): ReactNode {
  const curl = buildCurlExample({ spec, path, method, parameters, requestContent })
  const response = getPrimaryResponse(operation)
  const responseExample = getContentExample(response?.content?.value)
  const responseCode = stringifyExample(responseExample)

  return (
    <div className="space-y-6">
      <CodeGroup title="Request" tag={method} label={path}>
        <CodeBlock code={curl} language="bash" title="cURL" />
      </CodeGroup>
      {responseCode ? (
        <CodeGroup title="Response" tag={response?.status} label={response?.content?.mediaType}>
          <CodeBlock code={responseCode} language="json" title="JSON" />
        </CodeGroup>
      ) : null}
    </div>
  )
}

function OpenApiHeader({ spec }: { spec: OpenAPISpec }): ReactNode {
  return (
    <header className="mb-16">
      <p className="mb-3 font-mono text-xs/6 font-medium tracking-widest text-emerald-500 uppercase dark:text-emerald-400">
        OpenAPI Reference
      </p>
      <h1>{spec.info?.title ?? 'API Documentation'}</h1>
      {spec.info?.description ? <p className="lead">{spec.info.description}</p> : null}
      {spec.info?.version ? <p className="text-sm text-zinc-500 dark:text-zinc-400">Version {spec.info.version}</p> : null}
    </header>
  )
}

function OpenApiOperation({ spec, path, method, operation }: { spec: OpenAPISpec; path: string; method: string; operation: OpenAPIOperation }): ReactNode {
  const id = slug(`${method.toLowerCase()} ${path}`)
  const summary = operation.summary ?? `${method} ${path}`
  const description = operation.description
  const parameters = getOperationParameters(spec, path, operation)
  const requestBody = getRequestBody(operation)
  const requestContent = getJsonLikeContent(requestBody?.content)
  const requestSchema = requestContent?.value.schema
  const groupedParameters = {
    path: parameters.filter((parameter) => parameter.in === 'path'),
    query: parameters.filter((parameter) => parameter.in === 'query'),
    header: parameters.filter((parameter) => parameter.in === 'header'),
  }

  return (
    <section className="scroll-mt-24" aria-labelledby={id}>
      <Heading id={id} tag={method} label={path}>
        {summary}
      </Heading>
      <Row>
        <Col>
          {description ? <p>{description}</p> : null}
          <ParameterList title="Path parameters" parameters={groupedParameters.path} />
          <ParameterList title="Query parameters" parameters={groupedParameters.query} />
          <ParameterList title="Headers" parameters={groupedParameters.header} />
          {requestBody && requestContent ? (
            <>
              <h3>Request body</h3>
              {typeof requestBody.description === 'string' ? <p>{requestBody.description}</p> : null}
              <SchemaProperties title="Body properties" schema={requestSchema} />
            </>
          ) : null}
          <ResponseList operation={operation} />
        </Col>
        <Col sticky>
          <EndpointExamples
            spec={spec}
            path={path}
            method={method}
            operation={operation}
            parameters={parameters}
            requestContent={requestContent}
          />
        </Col>
      </Row>
    </section>
  )
}

function OpenApiPaths({ spec }: { spec: OpenAPISpec }): ReactNode {
  const entries = listOpenApiOperations(spec).map(({ path, method, operation }) => ({
    path,
    method: method.toUpperCase(),
    operation,
  }))

  return (
    <div className="space-y-16">
      {entries.map(({ path, method, operation }) => (
        <OpenApiOperation key={`${method}-${path}`} spec={spec} path={path} method={method} operation={operation} />
      ))}
    </div>
  )
}

function resolveRelativePath(fromDir: string, to: string): string {
  const parts = (fromDir + '/' + to).split('/').filter(Boolean)
  const stack: string[] = []
  for (const part of parts) {
    if (part === '..') {
      stack.pop()
    } else if (part !== '.') {
      stack.push(part)
    }
  }
  return stack.join('/')
}

function normalizeSpecPath(specPath: string, currentRoutePath?: string): string {
  if (specPath.startsWith(VIRTUAL_PREFIX)) return specPath
  if (specPath.startsWith('/')) {
    return VIRTUAL_PREFIX + specPath.replace(/^\//, '')
  }
  const fromDir = currentRoutePath === '/' ? '' : currentRoutePath?.replace(/^\//, '').replace(/\/[^/]*$/, '') ?? ''
  return VIRTUAL_PREFIX + resolveRelativePath(fromDir, specPath)
}

function useOpenApiSpec(spec?: OpenAPISpec, specPath?: string): OpenAPISpec | null {
  const specs = useOpenApiSpecs()
  const location = useLocation()

  if (spec) return spec
  if (!specPath) return null

  const normalized = normalizeSpecPath(specPath, location.pathname)
  return specs[normalized] ?? null
}

function WarningBox({ children, tone = 'amber' }: { children: ReactNode; tone?: 'amber' | 'red' }): ReactNode {
  const classes = tone === 'red'
    ? 'rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200'
    : 'rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'

  return <div className={classes}>{children}</div>
}

export function OpenApiPage(arg0: OpenApiPageProps): ReactNode {
  const { spec, specPath } = arg0
  const resolved = useOpenApiSpec(spec, specPath)

  if (!resolved) {
    return <WarningBox>OpenAPI spec not found: {specPath ?? '（未提供 spec 或 specPath）'}</WarningBox>
  }

  return (
    <article className="flex h-full flex-col pt-16 pb-10">
      <Prose className="flex-auto">
        <OpenApiHeader spec={resolved} />
        <OpenApiPaths spec={resolved} />
      </Prose>
    </article>
  )
}

export function ApiEndpoint(arg0: ApiEndpointProps): ReactNode {
  const { spec, path, method } = arg0
  const op = getOpenApiOperation(spec, path, method)

  if (!op) {
    return <WarningBox tone="red">Endpoint not found: {method.toUpperCase()} {path}</WarningBox>
  }

  return <OpenApiOperation spec={spec} path={path} method={method.toUpperCase()} operation={op} />
}

export function OpenApiEndpoint(arg0: OpenApiEndpointProps): ReactNode {
  const { specPath, path, method } = arg0
  const spec = useOpenApiSpec(undefined, specPath)

  if (!spec) {
    return <WarningBox>OpenAPI spec not found: {specPath}</WarningBox>
  }

  return <ApiEndpoint spec={spec} path={path} method={method} />
}
