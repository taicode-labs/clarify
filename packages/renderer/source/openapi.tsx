import type { ReactNode } from 'react'
import { slug } from 'github-slugger'

import { ApiEndpointCard } from './index'

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
  spec: OpenAPISpec
}

export type ApiEndpointProps = {
  spec: OpenAPISpec
  path: string
  method: string
}

function OpenApiHeader({ spec }: { spec: OpenAPISpec }): ReactNode {
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

function OpenApiPaths({ spec }: { spec: OpenAPISpec }): ReactNode {
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

export function OpenApiPage(arg0: OpenApiPageProps): ReactNode {
  const { spec } = arg0

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 md:px-10">
      <div className="mx-auto max-w-6xl">
        <OpenApiHeader spec={spec} />
        <OpenApiPaths spec={spec} />
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
