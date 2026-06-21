import type { ReactNode } from 'react'

import { Prose } from '../components'
import { useBuiltInText } from '../i18n'
import { Markdown } from '../mdx/Markdown'

import { OpenApiOperation } from './openapi-page'
import { useOpenApiSpec } from './spec-path'
import { getOpenApiOperation, listOpenApiOperations } from './utils'
import type { OpenAPISpec } from './utils'

type OpenApiPathsProps = { spec: OpenAPISpec }

type OpenApiHeaderProps = { spec: OpenAPISpec }

type WarningBoxProps = {
  children: ReactNode
  tone?: 'amber' | 'red'
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

function OpenApiHeader(arg0: OpenApiHeaderProps): ReactNode {
  const { spec } = arg0

  const t = useBuiltInText()
  return (
    <header className="mb-16">
      <p className="mb-3 text-xs/6 font-medium tracking-widest text-emerald-500 uppercase dark:text-emerald-400">
        {t('openapi.openApiReference')}
      </p>
      <h1>{spec.info?.title ?? t('openapi.apiDocumentation')}</h1>
      {spec.info?.description ? <Markdown className="lead *:first:mt-0 *:last:mb-0">{spec.info.description}</Markdown> : null}
      {spec.info?.version ? <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('openapi.version', { version: spec.info.version })}</p> : null}
    </header>
  )
}

function OpenApiPaths(arg0: OpenApiPathsProps): ReactNode {
  const { spec } = arg0

  const entries = listOpenApiOperations(spec).map(({ path, method, operation }) => ({
    path,
    method: method.toUpperCase(),
    operation,
  }))

  return (
    <div className="clarify-api-endpoints divide-y divide-zinc-200/70 dark:divide-white/10">
      {entries.map(({ path, method, operation }) => (
        <OpenApiOperation key={`${method}-${path}`} spec={spec} path={path} method={method} operation={operation} />
      ))}
    </div>
  )
}

function WarningBox(arg0: WarningBoxProps): ReactNode {
  const { children, tone = 'amber' } = arg0

  const classes = tone === 'red'
    ? 'rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200'
    : 'rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'

  return <div className={`clarify-warning ${classes}`}>{children}</div>
}

export function OpenApiPage(arg0: OpenApiPageProps): ReactNode {
  const { spec, specPath } = arg0
  const t = useBuiltInText()
  const resolved = useOpenApiSpec(spec, specPath)

  if (!resolved) {
    return <WarningBox>{t('openapi.specNotFound', { specPath: specPath ?? t('openapi.specPathMissing') })}</WarningBox>
  }

  return (
    <article className="clarify-openapi-page flex h-full flex-col pt-16 pb-10">
      <Prose className="flex-auto">
        <OpenApiHeader spec={resolved} />
        <OpenApiPaths spec={resolved} />
      </Prose>
    </article>
  )
}

export function ApiEndpoint(arg0: ApiEndpointProps): ReactNode {
  const { spec, path, method } = arg0
  const t = useBuiltInText()
  const op = getOpenApiOperation(spec, path, method)

  if (!op) {
    return <WarningBox tone="red">{t('openapi.endpointNotFound', { endpoint: `${method.toUpperCase()} ${path}` })}</WarningBox>
  }

  const normalizedMethod = method.toUpperCase()
  return <OpenApiOperation key={`${normalizedMethod}-${path}`} spec={spec} path={path} method={normalizedMethod} operation={op} />
}

export function OpenApiEndpoint(arg0: OpenApiEndpointProps): ReactNode {
  const { specPath, path, method } = arg0
  const t = useBuiltInText()
  const spec = useOpenApiSpec(undefined, specPath)

  if (!spec) {
    return <WarningBox>{t('openapi.specNotFound', { specPath })}</WarningBox>
  }

  return <ApiEndpoint spec={spec} path={path} method={method} />
}
