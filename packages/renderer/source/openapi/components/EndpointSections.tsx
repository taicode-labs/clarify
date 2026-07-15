import { type ReactNode } from 'react'

import { useBuiltInText } from '../../core/i18n'
import { Markdown } from '../../mdx/Markdown'
import { Col, Row } from '../../mdx/primitives'
import type { OpenAPIOperation, OpenAPIOperationSource, OpenAPISpec } from '../lib/utils'
import type { MediaTypeEntry, OpenApiParameter, OpenApiRecord, OpenApiServer, RequestAuthInputs } from '../types'

import { RequestExamplesPanel, ResponseExamplesPanel } from './ExamplePanels'
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
    auth,
    sharedExampleKey,
    onSelectExampleKey,
  } = arg0

  const t = useBuiltInText()
  const hasRequestBody = Boolean(requestBody && requestContents.length > 0)

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
        {typeof requestBody?.description === 'string' ? <Markdown>{requestBody.description}</Markdown> : null}
        <SchemaProperties title={t('openapi.bodyProperties')} schema={requestSchema} spec={spec} />
      </>
    )
  }

  return (
    <>
      {renderDescription()}
      <Row className="clarify-openapi-request-workspace relative mt-8 border-t border-(--clarify-theme-tokens-colors-border) pt-6">
        <Col>
          <div className="w-full">
            <ParameterList title={t('openapi.pathParameters')} parameters={groupedParameters.path} />
            <ParameterList title={t('openapi.queryParameters')} parameters={groupedParameters.query} />
            <ParameterList title={t('openapi.headers')} parameters={groupedParameters.header} />
            <div>
              <h3>{t('openapi.requestBody')}</h3>
              {renderRequestBody()}
            </div>
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
    <div className="mt-10 border-t border-(--clarify-theme-tokens-colors-border) pt-6">
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
