import clsx from 'clsx'
import { SearchIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { useBuiltInText } from '../../core/i18n'
import { Markdown } from '../../mdx/Markdown'
import { Col, Row } from '../../mdx/primitives'
import type { OpenAPIOperation, OpenAPIOperationSource, OpenAPISpec } from '../lib/utils'
import type { MediaTypeEntry, OpenApiParameter, OpenApiRecord, OpenApiServer, RequestAuthInputs } from '../types'

import { type AuthOption, RequestExamplesPanel, ResponseExamplesPanel } from './ExamplePanels'
import { OpenApiAuthDocumentation } from './OpenApiAuthDocumentation'
import { OpenApiDocumentSection } from './OpenApiDocumentSection'
import { ParameterList, ResponseList, SchemaProperties } from './SchemaProperties'

type EndpointRequestProps = {
  spec: OpenAPISpec
  path: string
  method: string
  operationSource?: OpenAPIOperationSource
  description?: string
  groupedParameters: {
    path: OpenApiParameter[]
    query: OpenApiParameter[]
    header: OpenApiParameter[]
  }
  parameters: OpenApiParameter[]
  requestBody?: OpenApiRecord
  requestContents: MediaTypeEntry[]
  requestSchema: unknown
  selectedRequestMediaType: string
  onSelectRequestMediaType: (value: string) => void
  selectedServer: OpenApiServer
  serverVariables: Record<string, string>
  authOptions: AuthOption[]
  auth?: RequestAuthInputs
  sharedExampleKey?: string
  onSelectExampleKey?: (value: string) => void
}

export function EndpointRequest(arg0: EndpointRequestProps): ReactNode {
  const {
    spec,
    path,
    method,
    operationSource = 'path',
    description,
    groupedParameters,
    parameters,
    requestBody,
    requestContents,
    requestSchema,
    selectedRequestMediaType,
    onSelectRequestMediaType,
    selectedServer,
    serverVariables,
    authOptions,
    auth,
    sharedExampleKey,
    onSelectExampleKey,
  } = arg0

  const t = useBuiltInText()
  const hasRequestBody = Boolean(requestBody && requestContents.length > 0)
  const [requestBodySearchOpen, setRequestBodySearchOpen] = useState(false)
  const [requestBodyQuery, setRequestBodyQuery] = useState('')

  const toggleRequestBodySearch = () => {
    setRequestBodySearchOpen((open) => {
      if (open) setRequestBodyQuery('')
      return !open
    })
  }

  const renderDescription = () => {
    if (!description) return null
    return <Markdown>{description}</Markdown>
  }

  const renderRequestBody = () => {
    if (!hasRequestBody) {
      return <p className="text-sm/5 text-(--clarify-ui-text-soft)">{t('openapi.requestBodyEmpty')}</p>
    }

    return (
      <>
        {requestBodySearchOpen ? (
          <label className="not-prose mb-3 flex h-9 items-center gap-2 rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) px-3 transition focus-within:border-(--clarify-theme-tokens-colors-primary) focus-within:ring-2 focus-within:ring-(--clarify-theme-tokens-colors-primary)/15">
            <SearchIcon className="size-4 shrink-0 text-(--clarify-ui-text-faint)" aria-hidden="true" />
            <span className="sr-only">{t('openapi.searchBodyProperties')}</span>
            <input
              type="search"
              value={requestBodyQuery}
              onChange={(event) => setRequestBodyQuery(event.target.value)}
              placeholder={t('openapi.searchBodyProperties')}
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-sm text-(--clarify-theme-tokens-colors-foreground) outline-none placeholder:text-(--clarify-ui-text-faint)"
            />
          </label>
        ) : null}
        {typeof requestBody?.description === 'string' ? <Markdown>{requestBody.description}</Markdown> : null}
        <SchemaProperties title={t('openapi.bodyProperties')} schema={requestSchema} spec={spec} query={requestBodyQuery} />
      </>
    )
  }

  return (
    <>
      {renderDescription()}
      <Row className="clarify-openapi-request-workspace relative mt-8 pt-6">
        <Col>
          <div className="flex w-full flex-col gap-6">
            <OpenApiAuthDocumentation options={authOptions} />
            <ParameterList title={t('openapi.pathParameters')} parameters={groupedParameters.path} />
            <ParameterList title={t('openapi.queryParameters')} parameters={groupedParameters.query} />
            <ParameterList title={t('openapi.headers')} parameters={groupedParameters.header} />
            <OpenApiDocumentSection
              title={t('openapi.requestBody')}
              action={hasRequestBody ? (
                <button
                  type="button"
                  aria-label={t('openapi.searchBodyProperties')}
                  aria-pressed={requestBodySearchOpen}
                  onClick={toggleRequestBodySearch}
                  className={clsx(
                    'flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-(--clarify-theme-tokens-radius-md) transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)',
                    requestBodySearchOpen
                      ? 'bg-(--clarify-ui-hover-background) text-(--clarify-theme-tokens-colors-primary)'
                      : 'text-(--clarify-ui-text-faint) hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-theme-tokens-colors-foreground)',
                  )}
                >
                  <SearchIcon className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            >
              {renderRequestBody()}
            </OpenApiDocumentSection>
          </div>
        </Col>
        <Col sticky>
          <div className="w-full">
            <RequestExamplesPanel
              spec={spec}
              path={path}
              method={method}
              parameters={parameters}
              requestContents={requestContents}
              selectedMediaType={selectedRequestMediaType}
              onSelectMediaType={onSelectRequestMediaType}
              selectedServer={selectedServer}
              serverVariables={serverVariables}
              auth={auth}
              operationSource={operationSource}
              sharedExampleKey={sharedExampleKey}
              onSelectExampleKey={onSelectExampleKey}
            />
          </div>
        </Col>
      </Row>
    </>
  )
}

type EndpointResponseProps = {
  spec: OpenAPISpec
  operation: OpenAPIOperation
  operationSource?: OpenAPIOperationSource
  sharedExampleKey?: string
  onSelectExampleKey?: (value: string) => void
  selectedStatus?: string
  onSelectStatus?: (value: string) => void
}

export function EndpointResponse(arg0: EndpointResponseProps): ReactNode {
  const { spec, operation, operationSource = 'path', sharedExampleKey, onSelectExampleKey, selectedStatus, onSelectStatus } = arg0
  const t = useBuiltInText()
  const responseTitle = operationSource === 'webhook' ? t('openapi.webhookResponses') : t('openapi.responses')
  const responseExampleTitle = operationSource === 'webhook' ? t('openapi.webhookResponse') : t('openapi.response')

  return (
    <div className="mt-10 pt-6">
      <Row className="clarify-openapi-response-workspace relative">
        <Col>
          <div className="w-full">
            <ResponseList title={responseTitle} operation={operation} spec={spec} selectedStatus={selectedStatus} onSelectStatus={onSelectStatus} />
          </div>
        </Col>
        <Col sticky>
          <div className="w-full">
            <ResponseExamplesPanel
              operation={operation}
              spec={spec}
              title={responseExampleTitle}
              sharedExampleKey={sharedExampleKey}
              onSelectExampleKey={onSelectExampleKey}
              selectedStatus={selectedStatus}
              onSelectStatus={onSelectStatus}
            />
          </div>
        </Col>
      </Row>
    </div>
  )
}
