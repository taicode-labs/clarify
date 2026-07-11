import type { ReactNode } from 'react'

import { PageTitleActions } from '../app/PageActions'
import { Prose } from '../components/Prose'
import { useBuiltInText } from '../core/i18n'
import { Markdown } from '../mdx/Markdown'

import { OpenApiOperation as OpenApiOperationComponent } from './components/OpenApiOperation'
import { useOpenApiSpec } from './lib/spec-path'
import { getOpenApiOperation, listOpenApiOperations } from './lib/utils'
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
  path: string
  method: string
}

export type OpenApiOperationProps = {
  specPath: string
  path: string
  method: string
}

function OpenApiHeader(arg0: OpenApiHeaderProps): ReactNode {
  const { spec } = arg0

  const t = useBuiltInText()
  return (
    <header className="clarify-openapi-header mb-16 border-b border-(--clarify-theme-tokens-colors-border) pb-8">
      <p className="mb-3 text-xs/6 font-medium tracking-widest text-(--clarify-ui-accent-text) uppercase">
        {t('openapi.openApiReference')}
      </p>
      <div className="clarify-page-title-row flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="clarify-page-title min-w-0 flex-1">{spec.info?.title ?? t('openapi.apiDocumentation')}</h1>
        <PageTitleActions />
      </div>
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
    .map(({ path, method, operation }) => ({
      path,
      method: method.toUpperCase(),
      operation,
    }))

  return (
    <div className="clarify-api-endpoints divide-y divide-zinc-200/70 dark:divide-white/10">
      {entries.map(({ path, method, operation }) => (
        <OpenApiOperationComponent key={`${method}-${path}`} spec={spec} path={path} method={method} operation={operation} />
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
    <article className="clarify-openapi-page flex h-full flex-col pt-16 pb-10">
      <Prose className="flex-auto">
        <OpenApiHeader spec={resolved} />
        <OpenApiPaths spec={resolved} tagFilter={tagFilter} />
      </Prose>
    </article>
  )
}

function OpenApiOperationWithSpec(arg0: OpenApiOperationWithSpecProps): ReactNode {
  const { spec, path, method } = arg0
  const t = useBuiltInText()
  const op = getOpenApiOperation(spec, path, method)

  if (!op) {
    return <WarningBox tone="red">{t('openapi.endpointNotFound', { endpoint: `${method.toUpperCase()} ${path}` })}</WarningBox>
  }

  const normalizedMethod = method.toUpperCase()
  return <OpenApiOperationComponent key={`${normalizedMethod}-${path}`} spec={spec} path={path} method={normalizedMethod} operation={op} />
}

export function OpenApiOperation(arg0: OpenApiOperationProps): ReactNode {
  const { specPath, path, method } = arg0
  const t = useBuiltInText()
  const { spec, loading } = useOpenApiSpec(undefined, specPath)

  if (loading) {
    return <WarningBox>{t('openapi.loading')}</WarningBox>
  }
  if (!spec) {
    return <WarningBox>{t('openapi.specNotFound', { specPath })}</WarningBox>
  }

  return <OpenApiOperationWithSpec spec={spec} path={path} method={method} />
}

export function createOpenApiRouteComponent(data: OpenApiRouteData) {
  return function OpenApiRoutePage() {
    return <OpenApiDocument spec={data.spec} />
  }
}
