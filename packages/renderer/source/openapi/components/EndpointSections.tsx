import type { ReactNode } from 'react'

import { useBuiltInText } from '../../core/i18n'
import { Markdown } from '../../mdx/Markdown'
import { Col, Row } from '../../mdx/primitives'
import type { OpenAPIOperation, OpenAPIOperationSource, OpenAPISpec } from '../lib/utils'
import type { MediaTypeEntry, OpenApiParameter, OpenApiRecord, OpenApiServer, RequestAuthInputs } from '../types'

import { type AuthOption, RequestExamplesPanel, ResponseExamplesPanel } from './ExamplePanels'
import { OpenApiAuthDocumentation } from './OpenApiAuthDocumentation'
import { OpenApiDocumentSection } from './OpenApiDocumentSection'
import { ParameterList, ResponseList, SchemaProperties } from './SchemaProperties'
import { SchemaSearchButton, SchemaSearchInput, useSchemaSearch } from './SchemaSearch'

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
  const requestBodySearch = useSchemaSearch()

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
        {requestBodySearch.open ? (
          <SchemaSearchInput label={t('openapi.searchBodyProperties')} value={requestBodySearch.query} onChange={requestBodySearch.onChange} />
        ) : null}
        {typeof requestBody?.description === 'string' ? <Markdown>{requestBody.description}</Markdown> : null}
        <SchemaProperties title={t('openapi.bodyProperties')} schema={requestSchema} spec={spec} query={requestBodySearch.query} />
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
              action={hasRequestBody ? <SchemaSearchButton label={t('openapi.searchBodyProperties')} open={requestBodySearch.open} onClick={requestBodySearch.toggle} /> : null}
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
              query={requestBodySearch.query}
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
  const responseBodySearch = useSchemaSearch()

  return (
    <div className="mt-10 pt-6">
      <Row className="clarify-openapi-response-workspace relative">
        <Col>
          <div className="w-full">
            <ResponseList
              title={responseTitle}
              operation={operation}
              spec={spec}
              selectedStatus={selectedStatus}
              onSelectStatus={onSelectStatus}
              query={responseBodySearch.query}
              search={{
                open: responseBodySearch.open,
                action: <SchemaSearchButton label={t('openapi.searchResponseBodyProperties')} open={responseBodySearch.open} onClick={responseBodySearch.toggle} />,
                input: <SchemaSearchInput label={t('openapi.searchResponseBodyProperties')} value={responseBodySearch.query} onChange={responseBodySearch.onChange} />,
              }}
            />
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
              query={responseBodySearch.query}
            />
          </div>
        </Col>
      </Row>
    </div>
  )
}
