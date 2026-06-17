import { slug } from 'github-slugger'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { ApiEndpointCard } from './components'
import { useClarifyConfig } from './context'

export type OpenAPISpec = {
  openapi?: string
  info?: { title?: string; description?: string; version?: string }
  paths?: Record<string, Record<string, OpenAPIOperation>>
}

export type OpenAPIOperation = {
  summary?: string
  description?: string
  parameters?: unknown[]
  requestBody?: unknown
  responses?: Record<string, unknown>
}

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

function OpenApiHeader(arg0: { spec: OpenAPISpec }): ReactNode {
  const { spec } = arg0

  return (
    <header className="mb-10">
      <h1 className="text-3xl font-bold md:text-5xl">
        {spec.info?.title ?? 'API Documentation'}
      </h1>
      {spec.info?.description ? (
        <p className="mt-3 max-w-2xl text-slate-600">{spec.info.description}</p>
      ) : null}
      {spec.info?.version ? (
        <p className="mt-1 text-sm text-slate-400">Version {spec.info.version}</p>
      ) : null}
    </header>
  )
}

function OpenApiPaths(arg0: { spec: OpenAPISpec }): ReactNode {
  const { spec } = arg0

  const paths = spec.paths ?? {}
  const entries: Array<{ path: string; method: string; op: OpenAPIOperation }> = []

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(methods)) {
      entries.push({ path, method: method.toUpperCase(), op })
    }
  }

  return (
    <div className="space-y-6">
      {entries.map(({ path, method, op }) => (
        <ApiEndpointCard
          key={`${method}-${path}`}
          id={slug(`${method.toLowerCase()} ${path}`)}
          method={method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'}
          path={path}
          description={op.summary ?? op.description}
        />
      ))}
    </div>
  )
}

const VIRTUAL_PREFIX = 'virtual:clarify-page/'

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
  const config = useClarifyConfig()
  const location = useLocation()

  if (spec) return spec
  if (!specPath) return null

  const specs = (config as { openApiSpecs?: Record<string, OpenAPISpec> }).openApiSpecs
  const normalized = normalizeSpecPath(specPath, location.pathname)
  return specs?.[normalized] ?? null
}

export function OpenApiPage(arg0: OpenApiPageProps): ReactNode {
  const { spec, specPath } = arg0
  const resolved = useOpenApiSpec(spec, specPath)

  if (!resolved) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        OpenAPI spec not found: {specPath ?? '（未提供 spec 或 specPath）'}
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 md:px-10">
      <div className="mx-auto max-w-6xl">
        <OpenApiHeader spec={resolved} />
        <OpenApiPaths spec={resolved} />
      </div>
    </main>
  )
}

export function ApiEndpoint(arg0: ApiEndpointProps): ReactNode {
  const { spec, path, method } = arg0
  const op = spec.paths?.[path]?.[method.toLowerCase()]

  if (!op) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Endpoint not found: {method.toUpperCase()} {path}
      </div>
    )
  }

  return (
    <ApiEndpointCard
      method={method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'}
      path={path}
      description={op.summary ?? op.description}
    />
  )
}

export function OpenApiEndpoint(arg0: OpenApiEndpointProps): ReactNode {
  const { specPath, path, method } = arg0
  const spec = useOpenApiSpec(undefined, specPath)

  if (!spec) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        OpenAPI spec not found: {specPath}
      </div>
    )
  }

  return <ApiEndpoint spec={spec} path={path} method={method} />
}
