import type { ReactNode } from 'react'

import { PageActions } from '../app/PageActions'
import { Prose } from '../components/Prose'
import { useBuiltInText } from '../core/i18n'
import { Markdown } from '../mdx/Markdown'

import { OpenApiOperation as OpenApiOperationComponent } from './components/OpenApiOperation'
import { OpenApiRequestWorkbench } from './components/OpenApiRequest'
import { useOpenApiSpec } from './lib/spec-path'
import { getOpenApiOperationEntryById, listOpenApiOperations } from './lib/utils'
import type { OpenAPISpec } from './lib/utils'

type OpenApiPathsProps = { spec: OpenAPISpec; tagFilter?: string[] }

type OpenApiHeaderProps = { spec: OpenAPISpec }

type WarningBoxProps = {
  children: ReactNode
  tone?: 'amber' | 'red'
}

export type OpenApiDocumentProps = {
  spec?: OpenAPISpec
  specPath?: string
  tagFilter?: string[]
}

export type OpenApiRouteData = {
  spec: OpenAPISpec
}

type OpenApiOperationWithSpecProps = {
  spec: OpenAPISpec
  operationId: string
}

export type OpenApiOperationProps = {
  specPath: string
  operationId: string
}

export type OpenApiRequestProps = OpenApiOperationProps & {
  requestExample?: string
}

function OpenApiHeader(arg0: OpenApiHeaderProps): ReactNode {
  const { spec } = arg0

  const t = useBuiltInText()
  return (
    <header className="clarify-openapi-header mb-16 border-b border-(--clarify-theme-tokens-colors-border) pb-8">
      <p className="mb-3 text-xs/6 font-medium tracking-widest text-(--clarify-ui-accent-text) uppercase">
        {t('openapi.openApiReference')}
      </p>
      <h1 className="clarify-page-title">{spec.info?.title ?? t('openapi.apiDocumentation')}</h1>
      {spec.info?.description ? <Markdown className="lead mt-4 *:first:mt-0 *:last:mb-0">{spec.info.description}</Markdown> : null}
      {spec.info?.version ? <p className="mt-4 text-sm text-(--clarify-ui-text-faint)">{t('openapi.version', { version: spec.info.version })}</p> : null}
    </header>
  )
}

function operationMatchesTags(operationTags: string[] | undefined, filterTags: string[] | undefined): boolean {
  if (!filterTags?.length) return true
  return operationTags?.some(tag => filterTags.includes(tag)) ?? false
}

function OpenApiPaths(arg0: OpenApiPathsProps): ReactNode {
  const { spec, tagFilter } = arg0

  const entries = listOpenApiOperations(spec)
    .filter(({ operation }) => operationMatchesTags(operation.tags, tagFilter))
    .map(({ path, method, operation, source }) => ({
      path,
      method: method.toUpperCase(),
      operation,
      source,
    }))

  return (
    <div className="clarify-openai-endpoints divide-y divide-zinc-200/70 dark:divide-white/10">
      {entries.map(({ path, method, operation, source }) => (
        <OpenApiOperationComponent key={`${source}-${method}-${path}`} spec={spec} path={path} method={method} operation={operation} operationSource={source} />
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

export function OpenApiDocument(arg0: OpenApiDocumentProps): ReactNode {
  const { spec, specPath, tagFilter } = arg0
  const t = useBuiltInText()
  const { spec: resolved, loading } = useOpenApiSpec(spec, specPath)

  if (loading) {
    return <WarningBox>{t('openapi.loading')}</WarningBox>
  }
  if (!resolved) {
    return <WarningBox>{t('openapi.specNotFound', { specPath: specPath ?? t('openapi.specPathMissing') })}</WarningBox>
  }

  return (
    <article className="clarify-openapi-page relative flex h-full flex-col pt-16 pb-10">
      <div className="clarify-page-actions mb-4 flex justify-end sm:absolute sm:top-16 sm:right-0 sm:mb-0">
        <PageActions />
      </div>
      <Prose className="flex-auto">
        <OpenApiHeader spec={resolved} />
        <OpenApiPaths spec={resolved} tagFilter={tagFilter} />
      </Prose>
    </article>
  )
}

function OpenApiOperationWithSpec(arg0: OpenApiOperationWithSpecProps): ReactNode {
  const { spec, operationId } = arg0
  const t = useBuiltInText()
  const entry = getOpenApiOperationEntryById(spec, operationId)

  if (!entry) {
    return <WarningBox tone="red">{t('openapi.endpointNotFound', { endpoint: operationId })}</WarningBox>
  }

  const normalizedMethod = entry.method.toUpperCase()
  return <OpenApiOperationComponent key={`${entry.source}-${normalizedMethod}-${entry.path}`} spec={spec} path={entry.path} method={normalizedMethod} operation={entry.operation} operationSource={entry.source} />
}

export function OpenApiOperation(arg0: OpenApiOperationProps): ReactNode {
  const { specPath, operationId } = arg0
  const t = useBuiltInText()
  const { spec, loading } = useOpenApiSpec(undefined, specPath)

  if (loading) {
    return <WarningBox>{t('openapi.loading')}</WarningBox>
  }
  if (!spec) {
    return <WarningBox>{t('openapi.specNotFound', { specPath })}</WarningBox>
  }

  return <OpenApiOperationWithSpec spec={spec} operationId={operationId} />
}

export function OpenApiRequest(arg0: OpenApiRequestProps): ReactNode {
  const { specPath, operationId, requestExample } = arg0
  const t = useBuiltInText()
  const { spec, loading } = useOpenApiSpec(undefined, specPath)

  if (loading) return <WarningBox>{t('openapi.loading')}</WarningBox>
  if (!spec) return <WarningBox>{t('openapi.specNotFound', { specPath })}</WarningBox>

  const entry = getOpenApiOperationEntryById(spec, operationId)
  if (!entry) return <WarningBox tone="red">{t('openapi.endpointNotFound', { endpoint: operationId })}</WarningBox>

  return (
    <OpenApiRequestWorkbench
      spec={spec}
      path={entry.path}
      method={entry.method.toUpperCase()}
      operation={entry.operation}
      operationSource={entry.source}
      requestExample={requestExample}
    />
  )
}

export function createOpenApiRouteComponent(data: OpenApiRouteData) {
  return function OpenApiRoutePage() {
    return <OpenApiDocument spec={data.spec} />
  }
}
