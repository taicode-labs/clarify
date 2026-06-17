import { slug } from 'github-slugger'
import { useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { Heading, Prose } from '../components'
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

type MediaTypeEntry = {
  mediaType: string
  value: OpenApiMediaType
}

type ExampleEntry = {
  key: string
  title: string
  summary?: string
  value: unknown
  generated?: boolean
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

function getMediaTypeEntries(content: unknown): MediaTypeEntry[] {
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

function getJsonLikeContent(content: unknown): MediaTypeEntry | undefined {
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

function getExampleEntries(mediaType?: OpenApiMediaType): ExampleEntry[] {
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
  return typeof generated === 'undefined' ? [] : [{ key: 'schema', title: 'Schema example', value: generated, generated: true }]
}

function getContentExample(mediaType?: OpenApiMediaType): unknown {
  return getExampleEntries(mediaType)[0]?.value
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

function codeLanguageForMediaType(mediaType?: string): string {
  if (!mediaType) return 'json'
  if (mediaType.includes('json')) return 'json'
  if (mediaType.includes('yaml') || mediaType.includes('yml')) return 'yaml'
  if (mediaType.startsWith('text/')) return 'text'
  if (mediaType.includes('xml')) return 'xml'
  return 'text'
}

function SelectControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}): ReactNode {
  if (options.length <= 1) return null

  return (
    <label className="flex flex-col gap-1 text-[0.625rem]/5 font-semibold tracking-widest text-zinc-400 uppercase">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 font-mono text-xs font-medium tracking-normal text-zinc-100 outline-hidden transition hover:border-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function ExamplePicker({
  examples,
  selectedKey,
  onSelect,
}: {
  examples: ExampleEntry[]
  selectedKey: string
  onSelect: (key: string) => void
}): ReactNode {
  const scrollerRef = useRef<HTMLDivElement>(null)

  if (examples.length <= 1) return null

  const scrollBy = (direction: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: direction * 160, behavior: 'smooth' })
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5 pt-2 sm:pt-0">
      <button
        type="button"
        aria-label="Scroll examples left"
        onClick={() => scrollBy(-1)}
        className="grid size-6 shrink-0 place-items-center rounded-full bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-200"
      >
        ←
      </button>
      <div
        ref={scrollerRef}
        className="scrollbar-none flex max-w-[min(22rem,calc(100vw-8rem))] snap-x gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {examples.map((example) => (
          <button
            key={example.key}
            type="button"
            onClick={() => onSelect(example.key)}
            className={[
              'snap-start whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition',
              example.key === selectedKey
                ? 'bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/30 ring-inset'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200',
            ].join(' ')}
          >
            {example.title}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label="Scroll examples right"
        onClick={() => scrollBy(1)}
        className="grid size-6 shrink-0 place-items-center rounded-full bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-200"
      >
        →
      </button>
    </div>
  )
}

function CopyCodeButton({ code }: { code: string }): ReactNode {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      onClick={() => {
        void window.navigator.clipboard.writeText(code).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1000)
        })
      }}
      className="absolute top-3.5 right-4 rounded-full bg-white/5 px-3 py-1 text-2xs font-medium text-zinc-400 opacity-0 transition hover:bg-white/10 hover:text-zinc-200 group-hover:opacity-100 focus:opacity-100"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function ApiExampleCodeGroup({
  title,
  tag,
  label,
  code,
  language,
  examples,
  selectedExampleKey,
  onSelectExample,
}: {
  title: string
  tag?: string
  label?: string
  code: string
  language: string
  examples?: ExampleEntry[]
  selectedExampleKey?: string
  onSelectExample?: (key: string) => void
}): ReactNode {
  return (
    <div className="my-6 overflow-hidden rounded-2xl bg-zinc-900 shadow-md dark:ring-1 dark:ring-white/10">
      <div className="not-prose">
        <div className="flex min-h-[calc(--spacing(12)+1px)] flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-700 bg-zinc-800 px-4 py-2 dark:border-zinc-800 dark:bg-transparent">
          <h3 className="mr-auto text-xs font-semibold text-white">{title}</h3>
          {examples && selectedExampleKey && onSelectExample ? (
            <ExamplePicker examples={examples} selectedKey={selectedExampleKey} onSelect={onSelectExample} />
          ) : null}
        </div>
        {tag || label ? (
          <div className="flex h-9 items-center gap-2 border-y border-t-transparent border-b-white/7.5 bg-zinc-900 px-4 dark:border-b-white/5 dark:bg-white/1">
            {tag ? <span className="font-mono text-[0.625rem]/6 font-semibold text-emerald-400">{tag}</span> : null}
            {tag && label ? <span className="h-0.5 w-0.5 rounded-full bg-zinc-500" /> : null}
            {label ? <span className="font-mono text-xs text-zinc-400">{label}</span> : null}
          </div>
        ) : null}
        <div className="group relative">
          <pre className="overflow-x-auto p-4 text-xs text-white">
            <code className={`language-${language}`}>{code}</code>
          </pre>
          <CopyCodeButton code={code} />
        </div>
      </div>
    </div>
  )
}

function RequestExamplesPanel({
  spec,
  path,
  method,
  parameters,
  requestContents,
}: {
  spec: OpenAPISpec
  path: string
  method: string
  parameters: OpenApiParameter[]
  requestContents: MediaTypeEntry[]
}): ReactNode {
  const [selectedMediaType, setSelectedMediaType] = useState(requestContents[0]?.mediaType ?? '')
  const selectedContent = requestContents.find((content) => content.mediaType === selectedMediaType) ?? requestContents[0]
  const examples = getExampleEntries(selectedContent?.value)
  const [selectedExampleKey, setSelectedExampleKey] = useState(examples[0]?.key ?? '')
  const selectedExample = examples.find((example) => example.key === selectedExampleKey) ?? examples[0]
  const requestContent = selectedContent ? { ...selectedContent, value: { ...selectedContent.value, example: selectedExample?.value, examples: undefined } } : undefined
  const curl = buildCurlExample({ spec, path, method, parameters, requestContent })

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3">
        <SelectControl
          label="Media type"
          value={selectedContent?.mediaType ?? ''}
          options={requestContents.map((content) => content.mediaType)}
          onChange={(value) => {
            setSelectedMediaType(value)
            setSelectedExampleKey(getExampleEntries(requestContents.find((content) => content.mediaType === value)?.value)[0]?.key ?? '')
          }}
        />
      </div>
      <ApiExampleCodeGroup
        title="Request"
        tag={method}
        label={path}
        code={curl}
        language="bash"
        examples={examples}
        selectedExampleKey={selectedExample?.key}
        onSelectExample={setSelectedExampleKey}
      />
    </div>
  )
}

function ResponseExamplesPanel({ operation }: { operation: OpenAPIOperation }): ReactNode {
  const responses = getResponseEntries(operation).filter(({ response }) => getMediaTypeEntries(response.content).length > 0)
  const [selectedStatus, setSelectedStatus] = useState(responses.find(({ status }) => status.startsWith('2'))?.status ?? responses[0]?.status ?? '')
  const selectedResponse = responses.find(({ status }) => status === selectedStatus) ?? responses[0]
  const responseContents = getMediaTypeEntries(selectedResponse?.response.content)
  const [selectedMediaType, setSelectedMediaType] = useState(responseContents[0]?.mediaType ?? '')
  const selectedContent = responseContents.find((content) => content.mediaType === selectedMediaType) ?? responseContents[0]
  const examples = getExampleEntries(selectedContent?.value)
  const [selectedExampleKey, setSelectedExampleKey] = useState(examples[0]?.key ?? '')
  const selectedExample = examples.find((example) => example.key === selectedExampleKey) ?? examples[0]
  const responseCode = stringifyExample(selectedExample?.value)

  if (!selectedResponse || !selectedContent || !responseCode) return null

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3">
        <SelectControl
          label="Status"
          value={selectedResponse.status}
          options={responses.map(({ status }) => status)}
          onChange={(value) => {
            const nextResponse = responses.find(({ status }) => status === value)
            const nextContents = getMediaTypeEntries(nextResponse?.response.content)
            setSelectedStatus(value)
            setSelectedMediaType(nextContents[0]?.mediaType ?? '')
            setSelectedExampleKey(getExampleEntries(nextContents[0]?.value)[0]?.key ?? '')
          }}
        />
        <SelectControl
          label="Media type"
          value={selectedContent.mediaType}
          options={responseContents.map((content) => content.mediaType)}
          onChange={(value) => {
            setSelectedMediaType(value)
            setSelectedExampleKey(getExampleEntries(responseContents.find((content) => content.mediaType === value)?.value)[0]?.key ?? '')
          }}
        />
      </div>
      <ApiExampleCodeGroup
        title="Response"
        tag={selectedResponse.status}
        label={selectedContent.mediaType}
        code={responseCode}
        language={codeLanguageForMediaType(selectedContent.mediaType)}
        examples={examples}
        selectedExampleKey={selectedExample?.key}
        onSelectExample={setSelectedExampleKey}
      />
    </div>
  )
}

function EndpointExamples({
  spec,
  path,
  method,
  operation,
  parameters,
  requestContents,
}: {
  spec: OpenAPISpec
  path: string
  method: string
  operation: OpenAPIOperation
  parameters: OpenApiParameter[]
  requestContents: MediaTypeEntry[]
}): ReactNode {
  return (
    <div className="space-y-6">
      <RequestExamplesPanel spec={spec} path={path} method={method} parameters={parameters} requestContents={requestContents} />
      <ResponseExamplesPanel operation={operation} />
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
  const requestContents = getMediaTypeEntries(requestBody?.content)
  const requestSchema = requestContents[0]?.value.schema
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
          {requestBody && requestContents.length > 0 ? (
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
            requestContents={requestContents}
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
    <div className="mx-auto w-full max-w-5xl space-y-16 lg:max-w-6xl">
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
