import clsx from 'clsx'
import { slug } from 'github-slugger'
import type { ReactNode } from 'react'

import { Heading, Prose } from '../components'
import { useBuiltInText } from '../i18n'
import { Col, Row } from '../mdx/primitives'

import { RequestExamplesPanel, ResponseExamplesPanel } from './example-panels'
import { getMediaTypeEntries, getOperationParameters, getRequestBody } from './helpers'
import { SchemaProperties, ParameterList, ResponseList } from './schema-properties'
import { useOpenApiSpec } from './spec-path'
import type { OpenApiParameter, MediaTypeEntry } from './types'
import { getOpenApiOperation, listOpenApiOperations } from './utils'
import type { OpenAPIOperation, OpenAPISpec } from './utils'

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

function EndpointExamples(arg0: {
  spec: OpenAPISpec
  path: string
  method: string
  operation: OpenAPIOperation
  parameters: OpenApiParameter[]
  requestContents: MediaTypeEntry[]
}): ReactNode {  const {
  spec,
  path,
  method,
  operation,
  parameters,
  requestContents,
} = arg0

  return (
    <div className="space-y-6">
      <RequestExamplesPanel spec={spec} path={path} method={method} parameters={parameters} requestContents={requestContents} />
      <ResponseExamplesPanel operation={operation} />
    </div>
  )
}

function OpenApiHeader(arg0: { spec: OpenAPISpec }): ReactNode {  const { spec } = arg0

  const t = useBuiltInText()
  return (
    <header className="mb-16">
      <p className="mb-3 font-mono text-xs/6 font-medium tracking-widest text-emerald-500 uppercase dark:text-emerald-400">
        {t('openapi.openApiReference')}
      </p>
      <h1>{spec.info?.title ?? t('openapi.apiDocumentation')}</h1>
      {spec.info?.description ? <p className="lead">{spec.info.description}</p> : null}
      {spec.info?.version ? <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('openapi.version', { version: spec.info.version })}</p> : null}
    </header>
  )
}

function OpenApiOperation(arg0: { spec: OpenAPISpec; path: string; method: string; operation: OpenAPIOperation }): ReactNode {  const { spec, path, method, operation } = arg0

  const t = useBuiltInText()
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
    <section className="clarify-api-endpoint scroll-mt-24" aria-labelledby={id}>
      <Heading id={id} tag={method} label={path}>
        {summary}
      </Heading>
      <Row>
        <Col>
          {description ? <p>{description}</p> : null}
          <ParameterList title={t('openapi.pathParameters')} parameters={groupedParameters.path} />
          <ParameterList title={t('openapi.queryParameters')} parameters={groupedParameters.query} />
          <ParameterList title={t('openapi.headers')} parameters={groupedParameters.header} />
          {requestBody && requestContents.length > 0 ? (
            <>
              <h3>{t('openapi.requestBody')}</h3>
              {typeof requestBody.description === 'string' ? <p>{requestBody.description}</p> : null}
              <SchemaProperties title={t('openapi.bodyProperties')} schema={requestSchema} spec={spec} />
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

function OpenApiPaths(arg0: { spec: OpenAPISpec }): ReactNode {  const { spec } = arg0

  const entries = listOpenApiOperations(spec).map(({ path, method, operation }) => ({
    path,
    method: method.toUpperCase(),
    operation,
  }))

  return (
    <div className="clarify-api-endpoints space-y-16">
      {entries.map(({ path, method, operation }) => (
        <OpenApiOperation key={`${method}-${path}`} spec={spec} path={path} method={method} operation={operation} />
      ))}
    </div>
  )
}

function WarningBox(arg0: { children: ReactNode; tone?: 'amber' | 'red' }): ReactNode {  const { children, tone = 'amber' } = arg0

  const classes = tone === 'red'
    ? 'rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200'
    : 'rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'

  return <div className={clsx('clarify-warning', classes)}>{children}</div>
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

  return <OpenApiOperation spec={spec} path={path} method={method.toUpperCase()} operation={op} />
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
