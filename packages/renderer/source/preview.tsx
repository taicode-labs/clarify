import { useState, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { SectionProvider } from './components/SectionProvider'
import type { Section } from './components/SectionProvider'
import { ClarifyConfigContext, ClarifyLocaleContext, OpenApisContext } from './context'
import { authPlaceholder, defaultServerVariables, getAuthOptions, getServerKey, getServers, RequestExamplesPanel, ResponseExamplesPanel } from './openapi/example-panels'
import { getMediaTypeEntries, getRequestBody } from './openapi/helpers'
import { EndpointIdentity } from './openapi/openapi-page'
import type { OpenApiParameter, RequestAuthInput } from './openapi/types'
import type { OpenAPIOperation, OpenAPISpec } from './openapi/utils'
import { Navigation } from './shell'
import type { ClarifyConfig, NavigationNode } from './types'

export type PreviewParameter = {
  name: string
  in: string
  type: string
  required?: boolean
  description?: string
  schema?: unknown
}

export type PreviewEndpoint = {
  method: string
  path: string
  summary: string
  description: string
  parameters?: PreviewParameter[]
  requestDescription?: string
  requestSchema?: unknown
  requestExample?: unknown
  response?: string
  responseStatus?: string
  responseDescription?: string
  responseSchema?: unknown
  responseExample?: unknown
}

export type PreviewGuide = {
  label: string
  title: string
  body: string
  embed: string
  outputs?: string[]
}

export type PreviewMetric = {
  label: string
  value: string
  hint?: string
}

export type PreviewCard = {
  title: string
  description: string
}

const embeddedEndpoint = {
  method: 'GET',
  path: '/examples/basic-request',
  summary: 'Basic request',
  description: 'Rendered from api.openapi.json inside the MDX guide.',
  parameters: [
    { name: 'cursor', in: 'query', type: 'string', description: 'Start after this cursor.' },
    { name: 'limit', in: 'query', type: 'integer', description: 'Max items to return.' },
    { name: 'X-Trace-Id', in: 'header', type: 'string', description: 'Optional request trace.' },
  ],
  responseDescription: 'A page of example records.',
  responseSchema: {
    type: 'object',
    required: ['items'],
    properties: {
      items: { type: 'array', items: { type: 'object' } },
      next: { type: 'string' },
    },
  },
  responseExample: {
    items: [],
    next: 'cursor_2',
  },
} satisfies PreviewEndpoint

const embeddedGuide = {
  label: 'source/en-US/openapi/embedding.mdx',
  title: 'Embed OpenAPI in MDX',
  body: 'Use MDX for workflow context, then render the exact operation from the spec.',
  embed: '<OpenApiEndpoint specPath="/api" path="/examples/basic-request" method="get" />',
  outputs: ['/openapi/embedding', '/api', '/api.openapi.json', '/llms.txt'],
} satisfies PreviewGuide

const staticOutputEndpoint = {
  method: 'POST',
  path: '/api/{id}/path',
  summary: 'Create static build',
  description: 'Build static docs from MDX and OpenAPI sources.',
  parameters: [
    { name: 'id', in: 'path', type: 'string', required: true, description: 'Project ID.' }
  ],
  responseDescription: 'Build metadata and static outputs.',
  responseSchema: {
    type: 'object',
    required: ['id', 'status', 'outputs'],
    properties: {
      id: { type: 'string', description: 'Build identifier.' },
      status: { type: 'string', enum: ['queued', 'running', 'ready'], description: 'Current build state.' },
      outputs: {
        type: 'array',
        description: 'Generated static artifacts.',
        items: {
          type: 'object',
          required: ['path', 'kind'],
          properties: {
            path: { type: 'string' },
            kind: { type: 'string', enum: ['html', 'asset', 'openapi', 'llms'] },
          },
        },
      },
    },
  },
  requestDescription: 'Static build options.',
  requestSchema: {
    type: 'object',
    required: ['source', 'output'],
    properties: {
      source: { type: 'string', description: 'MDX source root.' },
      output: { type: 'string', description: 'Static output root.' },
      includeSearchIndex: { type: 'boolean', description: 'Generate search data.' },
    },
  },
  requestExample: {
    source: 'source',
    output: 'output',
    includeSearchIndex: true,
  },
  responseExample: {
    id: 'build_01HY',
    status: 'ready',
    outputs: [
      { path: '/openapi/index.html', kind: 'html' },
      { path: '/api.openapi.json', kind: 'openapi' },
      { path: '/llms.txt', kind: 'llms' },
    ],
  },
} satisfies PreviewEndpoint

const previewConfig = {
  title: 'Clarify preview',
  description: 'Renderer preview environment',
  rootDirectory: 'source',
  routePrefix: '/',
  outputDirectory: 'output',
  theme: {
    preset: 'default',
    tokens: {
      colors: {
        primary: '#2563eb',
        accent: '#60a5fa',
        background: '#ffffff',
        foreground: '#18181b',
        surface: '#ffffff',
        muted: '#71717a',
        border: 'rgb(24 24 27 / 0.1)',
        codeBackground: '#f4f4f5',
      },
      radius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
    },
    layout: {
      maxWidth: '88rem',
    },
  },
  i18n: {
    defaultLocale: 'en',
    missing: 'fallback',
    locales: [{ code: 'en', label: 'English' }],
  },
} satisfies ClarifyConfig

const methodStyles: Record<string, string> = {
  GET: 'bg-emerald-400/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300',
  POST: 'bg-sky-400/15 text-sky-600 dark:bg-sky-400/20 dark:text-sky-300',
  PUT: 'bg-amber-400/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300',
  PATCH: 'bg-amber-400/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300',
  DELETE: 'bg-rose-400/15 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300',
}

const mainPreviewPath = '/openapi/embedding'

const mainPreviewSections = [
  { id: 'overview', title: 'Overview' },
  { id: 'request-example', title: 'Request example' }
] satisfies Section[]

function PreviewEnvironment(arg0: { children: ReactNode; initialEntry?: string; sections?: Section[] }) {
  const { children, initialEntry = '/preview', sections = [] } = arg0

  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <ClarifyConfigContext.Provider value={previewConfig}>
        <ClarifyLocaleContext.Provider value={previewConfig.i18n.defaultLocale}>
          <OpenApisContext.Provider value={{}}>
            <SectionProvider sections={sections}>
              {children}
            </SectionProvider>
          </OpenApisContext.Provider>
        </ClarifyLocaleContext.Provider>
      </ClarifyConfigContext.Provider>
    </MemoryRouter>
  )
}

function Chrome(arg0: { title: string; status?: string; children: ReactNode }) {
  const { title, status, children } = arg0

  return (
    <div className="clarify-app clarify-preview h-full overflow-hidden bg-(--clarify-theme-tokens-colors-background) text-(--clarify-ui-text) shadow-2xl ring-1 ring-(--clarify-theme-tokens-colors-border) dark:bg-zinc-950 dark:text-white dark:ring-white/10">
      <div className="flex items-center gap-3 border-b border-(--clarify-theme-tokens-colors-border) px-4 py-3 text-xs/6 text-(--clarify-ui-text-faint) dark:border-white/10">
        <span className="size-2 rounded-full bg-rose-400" />
        <span className="size-2 rounded-full bg-amber-400" />
        <span className="size-2 rounded-full bg-emerald-400" />
        <span className="ml-2 truncate font-medium text-(--clarify-ui-text-soft)">{title}</span>
        {status ? <span className="ml-auto hidden rounded-full bg-emerald-400/15 px-2 py-0.5 font-medium text-emerald-700 sm:inline dark:text-emerald-300">{status}</span> : null}
      </div>
      {children}
    </div>
  )
}

function MethodBadge(arg0: { method: string }) {
  const method = arg0.method.toUpperCase()

  return (
    <span className={`rounded-md px-2.5 py-0.5 text-xs/6 font-black tracking-wide ${methodStyles[method] ?? 'bg-(--clarify-ui-subtle-background) text-(--clarify-ui-text-soft)'}`}>
      {method}
    </span>
  )
}

function createPreviewNavigation(arg0: { endpoint: PreviewEndpoint; guide?: PreviewGuide; outputs: string[] }): NavigationNode[] {
  const { endpoint, guide, outputs } = arg0

  return [
    {
      title: 'Guides',
      path: '/guides',
      icon: 'BookOpenText',
      children: [
        { title: guide?.title ?? 'MDX guide', path: mainPreviewPath, icon: 'FileText' },
        { title: 'Getting started', path: '/getting-started', icon: 'Rocket' },
      ],
    },
    {
      title: 'API Reference',
      path: '/api',
      icon: 'Braces',
      children: [
        { title: endpoint.summary, path: endpoint.path, icon: 'Cable' },
        { title: 'Generate static output', path: staticOutputEndpoint.path, icon: 'UploadCloud' },
      ],
    },
    {
      title: 'Build Output',
      path: '/output',
      icon: 'PackageCheck',
      children: [
        { title: `Routes (${outputs.length})`, path: '/output/routes', icon: 'ListTree' }
      ],
    },
  ] satisfies NavigationNode[]
}

function PreviewNavigation(arg0: { endpoint: PreviewEndpoint; guide?: PreviewGuide; outputs: string[] }) {
  return <Navigation navigation={createPreviewNavigation(arg0)} className="px-2" />
}

function schemaFromType(type: string): unknown {
  if (type.endsWith('[]')) return { type: 'array', items: schemaFromType(type.slice(0, -2)) }
  if (type === 'number' || type === 'integer' || type === 'boolean' || type === 'object') return { type }
  return { type: 'string' }
}

function parseResponseExample(endpoint: PreviewEndpoint): unknown {
  if (typeof endpoint.responseExample !== 'undefined') return endpoint.responseExample
  if (!endpoint.response) return undefined

  try {
    return JSON.parse(endpoint.response)
  } catch {
    return endpoint.response
  }
}

function inferSchemaFromExample(example: unknown): unknown {
  if (Array.isArray(example)) {
    return { type: 'array', items: inferSchemaFromExample(example[0]) ?? { type: 'object' } }
  }

  if (typeof example === 'object' && example !== null) {
    return {
      type: 'object',
      properties: Object.fromEntries(Object.entries(example).map(([key, value]) => [key, inferSchemaFromExample(value)])),
    }
  }

  if (typeof example === 'number') return { type: Number.isInteger(example) ? 'integer' : 'number' }
  if (typeof example === 'boolean') return { type: 'boolean' }
  return typeof example === 'undefined' ? undefined : { type: 'string' }
}

function normalizeParameterLocation(location: string): string {
  return location === 'route' ? 'path' : location
}

function toOpenApiParameter(parameter: PreviewParameter): OpenApiParameter {
  return {
    name: parameter.name,
    in: normalizeParameterLocation(parameter.in),
    required: parameter.required,
    description: parameter.description,
    schema: parameter.schema ?? schemaFromType(parameter.type),
  }
}

function createPreviewOpenApi(endpoint: PreviewEndpoint): { operation: OpenAPIOperation; spec: OpenAPISpec; parameters: OpenApiParameter[] } {
  const method = endpoint.method.toLowerCase()
  const parameters = (endpoint.parameters ?? []).map(toOpenApiParameter)
  const responseExample = parseResponseExample(endpoint)
  const responseSchema = endpoint.responseSchema ?? inferSchemaFromExample(responseExample)
  const requestSchema = endpoint.requestSchema ?? inferSchemaFromExample(endpoint.requestExample)
  const operation = {
    summary: endpoint.summary,
    description: endpoint.description,
    parameters,
    requestBody: requestSchema
      ? {
          description: endpoint.requestDescription,
          required: true,
          content: {
            'application/json': {
              schema: requestSchema,
              example: endpoint.requestExample,
            },
          },
        }
      : undefined,
    responses: {
      [endpoint.responseStatus ?? '200']: {
        description: endpoint.responseDescription ?? 'OK',
        content: {
          'application/json': {
            schema: responseSchema,
            example: responseExample,
          },
        },
      },
    },
  } as OpenAPIOperation
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Clarify Build API',
      version: '2026-06-20',
      description: 'API reference generated from OpenAPI and rendered as static documentation.',
    },
    servers: [
      {
        url: 'https://server',
        description: 'Production'
      },
       {
        url: 'https://test-server',
        description: 'Test'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      [endpoint.path]: {
        [method]: operation,
      },
    },
  } as OpenAPISpec

  return { operation, spec, parameters }
}

function OpenApiExamplesPreview(arg0: { endpoint: PreviewEndpoint }) {
  const { endpoint } = arg0
  const { operation, spec, parameters } = createPreviewOpenApi(endpoint)
  const method = endpoint.method.toUpperCase()
  const requestBody = getRequestBody(spec, operation)
  const requestContents = getMediaTypeEntries(requestBody?.content, spec)
  const [selectedRequestMediaType, setSelectedRequestMediaType] = useState(requestContents[0]?.mediaType ?? '')
  const selectedRequestContent = requestContents.find((content) => content.mediaType === selectedRequestMediaType) ?? requestContents[0]
  const servers = getServers(spec, operation, endpoint.path)
  const [selectedServerKey, setSelectedServerKey] = useState(getServerKey(servers[0], 0))
  const selectedServer = servers.find((server, index) => getServerKey(server, index) === selectedServerKey) ?? servers[0]
  const [serverVariables, setServerVariables] = useState(defaultServerVariables(selectedServer))
  const [serverOpen, setServerOpen] = useState(false)
  const authOptions = getAuthOptions(spec, operation)
  const [selectedAuthName, setSelectedAuthName] = useState(authOptions[0]?.name ?? '')
  const selectedAuth = authOptions.find((option) => option.name === selectedAuthName)
  const [authValues, setAuthValues] = useState<Record<string, string>>({})
  const [authOpen, setAuthOpen] = useState(false)
  const authInput: RequestAuthInput | undefined = selectedAuth
    ? { name: selectedAuth.name, scheme: selectedAuth.scheme, value: authValues[selectedAuth.name] ?? authPlaceholder(selectedAuth) }
    : undefined

  return (
    <div className="space-y-4">
      <EndpointIdentity
        method={method}
        path={endpoint.path}
        servers={servers}
        selectedServerKey={selectedServerKey}
        selectedServer={selectedServer}
        serverVariables={serverVariables}
        serverOpen={serverOpen}
        authOptions={authOptions}
        selectedAuthName={selectedAuthName}
        selectedAuth={selectedAuth}
        authValues={authValues}
        authOpen={authOpen}
        onSelectServer={(value) => {
          const nextServer = servers.find((server, index) => getServerKey(server, index) === value) ?? servers[0]
          setSelectedServerKey(value)
          setServerVariables(defaultServerVariables(nextServer))
        }}
        onChangeServerVariable={(name, value) => setServerVariables((current) => ({ ...current, [name]: value }))}
        onToggleServer={() => {
          setServerOpen((current) => !current)
          setAuthOpen(false)
        }}
        onToggleAuth={() => {
          setAuthOpen((current) => !current)
          setServerOpen(false)
        }}
        onSelectAuth={setSelectedAuthName}
        onChangeAuthValue={(name, value) => setAuthValues((current) => ({ ...current, [name]: value }))}
      />
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <RequestExamplesPanel
          spec={spec}
          path={endpoint.path}
          method={method}
          parameters={parameters}
          requestContents={requestContents}
          selectedMediaType={selectedRequestContent?.mediaType ?? ''}
          onSelectMediaType={setSelectedRequestMediaType}
          selectedServer={selectedServer}
          serverVariables={serverVariables}
          auth={authInput}
        />
        <ResponseExamplesPanel operation={operation} spec={spec} />
      </div>
    </div>
  )
}

function PreviewMetricGrid(arg0: { metrics: PreviewMetric[] }) {
  const { metrics } = arg0

  return (
    <div className="grid grid-cols-3 gap-2">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-xl border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-2.5 shadow-sm dark:border-white/10 dark:bg-zinc-900/50">
          <div className="text-xs/5 text-(--clarify-ui-text-faint)">{metric.label}</div>
          <div className="text-base/6 font-semibold text-(--clarify-ui-text-strong)">{metric.value}</div>
          {metric.hint ? <div className="text-xs/5 text-(--clarify-ui-text-faint)">{metric.hint}</div> : null}
        </div>
      ))}
    </div>
  )
}

function PreviewLabel(arg0: { children: ReactNode }) {
  return <div className="text-xs/5 font-semibold uppercase tracking-wider text-(--clarify-ui-text-faint)">{arg0.children}</div>
}

function GuideSummaryPreview(arg0: { guide: PreviewGuide }) {
  const { guide } = arg0

  return (
    <header className="border-b border-(--clarify-theme-tokens-colors-border) pb-4 dark:border-white/10">
      <PreviewLabel>{guide.label}</PreviewLabel>
      <h2 className="mt-1 text-xl/7 font-semibold tracking-tight text-(--clarify-ui-text-strong)">{guide.title}</h2>
      <p className="mt-2 max-w-2xl text-sm/6 text-(--clarify-ui-text-soft)">{guide.body}</p>
      <pre className="mt-3 overflow-hidden rounded-xl bg-zinc-950 px-3 py-2 text-xs/5 whitespace-pre-wrap text-zinc-300">{guide.embed}</pre>
    </header>
  )
}

function EndpointSummaryPreview(arg0: { endpoint: PreviewEndpoint }) {
  const { endpoint } = arg0

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-3">
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-medium text-(--clarify-ui-text)">{endpoint.path}</code>
      </div>
      <h3 className="mt-3 text-lg/7 font-semibold tracking-tight text-(--clarify-ui-text-strong)">{endpoint.summary}</h3>
      <p className="mt-1 text-sm/6 text-(--clarify-ui-text-soft)">{endpoint.description}</p>
    </div>
  )
}

function EmbeddedApiPreview(arg0: { endpoint: PreviewEndpoint }) {
  const { endpoint } = arg0

  return (
    <div className="clarify-preview-api-frame min-w-0 overflow-hidden border-t border-(--clarify-theme-tokens-colors-border) pt-4 dark:border-white/10">
      <div className="clarify-preview-api-content clarify-preview-api-content-embedded">
        <OpenApiExamplesPreview endpoint={endpoint} />
      </div>
    </div>
  )
}

function OutputListPreview(arg0: { outputs: string[] }) {
  const { outputs } = arg0

  return (
    <div className="border-t border-(--clarify-theme-tokens-colors-border) pt-4 dark:border-white/10">
      <PreviewLabel>Static output</PreviewLabel>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {outputs.map((output) => (
          <div key={output} className="flex items-center gap-2 rounded-lg bg-(--clarify-ui-subtle-background) px-3 py-2 text-xs/5 text-(--clarify-ui-text-soft) dark:bg-white/5">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span className="truncate font-mono">{output}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MainContentPreview() {
  return (
    <section className="min-w-0 bg-(--clarify-theme-tokens-colors-background) px-5 py-4 dark:bg-zinc-950">
      <div className="clarify-preview-content-window overflow-hidden">
        <div className="space-y-4">
          <GuideSummaryPreview guide={embeddedGuide} />
          <PreviewMetricGrid metrics={[
            { label: 'MDX', value: 'Guide', hint: 'context' },
            { label: 'Spec', value: 'OpenAPI', hint: 'source' },
            { label: 'Out', value: 'Static', hint: 'CDN' },
          ]} />
          <div className="clarify-preview-endpoint-grid grid gap-4">
            <EndpointSummaryPreview endpoint={embeddedEndpoint} />
            <EmbeddedApiPreview endpoint={embeddedEndpoint} />
          </div>
          <OutputListPreview outputs={embeddedGuide.outputs ?? []} />
        </div>
      </div>
    </section>
  )
}

export function MainPreview() {
  return (
    <PreviewEnvironment initialEntry={mainPreviewPath} sections={mainPreviewSections}>
      <Chrome title="source/en-US/openapi/embedding.mdx" status="Rendered from OpenAPI + MDX">
        <div className="clarify-preview-shell grid">
          <aside className="border-r border-(--clarify-theme-tokens-colors-border) bg-(--clarify-ui-subtle-background) px-1 py-4 text-sm/7 dark:border-white/10 dark:bg-white/5">
            <PreviewNavigation endpoint={embeddedEndpoint} guide={embeddedGuide} outputs={embeddedGuide.outputs ?? []} />
          </aside>
          <MainContentPreview />
        </div>
      </Chrome>
    </PreviewEnvironment>
  )
}

export function MdxPreview() {
  return (
    <PreviewEnvironment>
      <Chrome title="source/started/index.mdx" status="Rendered by renderer">
        <div className="clarify-preview-body overflow-hidden bg-(--clarify-theme-tokens-colors-background) p-5 dark:bg-zinc-950">
          <article className="max-w-3xl text-sm/7 text-(--clarify-ui-text-soft)">
            <div className="inline-flex rounded-full bg-(--clarify-ui-accent-background) px-3 py-1 text-xs/5 font-semibold text-(--clarify-ui-accent-text)">MDX page</div>
            <h2 className="mt-3 text-2xl/8 font-semibold tracking-tight text-(--clarify-ui-text-strong)">Get Started</h2>
            <p className="mt-3">Write pages in source/. Clarify turns MDX, config, and OpenAPI files into routes.</p>
            <div className="mt-5 rounded-2xl border border-(--clarify-ui-accent-border) bg-(--clarify-ui-accent-background) p-4 text-sm/6 text-(--clarify-ui-text-strong)">
              <div className="font-semibold text-(--clarify-ui-text-strong)">Static output ready</div>
              <p className="mt-1">output/ is plain static files.</p>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900/50">
                <h3 className="text-base/6 font-semibold text-(--clarify-ui-text-strong)">MDX pages</h3>
                <p className="mt-2 text-sm/6">Guides live beside code.</p>
              </div>
              <div className="rounded-2xl border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900/50">
                <h3 className="text-base/6 font-semibold text-(--clarify-ui-text-strong)">API embeds</h3>
                <p className="mt-2 text-sm/6">Specs render inline.</p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <MethodBadge method={embeddedEndpoint.method} />
                <code className="text-sm font-medium text-(--clarify-ui-text)">{embeddedEndpoint.path}</code>
              </div>
              <p className="mt-3 text-sm/6">{embeddedEndpoint.description}</p>
            </div>
          </article>
        </div>
      </Chrome>
    </PreviewEnvironment>
  )
}

export function OpenApiPreview() {
  return (
    <PreviewEnvironment>
      <Chrome title="source/api.openapi.json" status="Endpoint + examples">
        <div className="clarify-preview-openapi-window overflow-hidden bg-(--clarify-theme-tokens-colors-background) px-4 py-4 dark:bg-zinc-950">
          <div className="clarify-preview-openapi-mask h-full overflow-hidden">
            <div className="clarify-preview-api-content clarify-preview-api-content-openapi origin-top pb-10">
              <OpenApiExamplesPreview endpoint={staticOutputEndpoint} />
            </div>
          </div>
        </div>
      </Chrome>
    </PreviewEnvironment>
  )
}
