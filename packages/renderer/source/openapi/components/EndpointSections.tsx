import { type ReactNode } from 'react'

import { useBuiltInText } from '../../core/i18n'
import { Markdown } from '../../mdx/Markdown'
import { Col, Row } from '../../mdx/primitives'
import type { OpenAPIOperation, OpenAPISpec } from '../lib/utils'
import type { MediaTypeEntry, OpenApiParameter, OpenApiRecord, OpenApiServer, RequestAuthInput } from '../types'

import { RequestExamplesPanel, ResponseExamplesPanel } from './ExamplePanels'
import { ParameterList, ResponseList, SchemaProperties } from './SchemaProperties'

type EndpointRequestProps = {
  spec: OpenAPISpec
  path: string
  method: string
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
  auth?: RequestAuthInput
  sharedExampleKey?: string
  onSelectExampleKey?: (value: string) => void
}

export function EndpointRequest(arg0: EndpointRequestProps): ReactNode {
  const {
    spec,
    path,
    method,
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

  return (
    <>
      {description ? <Markdown>{description}</Markdown> : null}
      <Row className="relative mt-6">
        <Col>
          <div className="w-full">
            <ParameterList title={t('openapi.pathParameters')} parameters={groupedParameters.path} />
            <ParameterList title={t('openapi.queryParameters')} parameters={groupedParameters.query} />
            <ParameterList title={t('openapi.headers')} parameters={groupedParameters.header} />
            {requestBody && requestContents.length > 0 ? (
              <>
                <h3>{t('openapi.requestBody')}</h3>
                {typeof requestBody.description === 'string' ? <Markdown>{requestBody.description}</Markdown> : null}
                <SchemaProperties title={t('openapi.bodyProperties')} schema={requestSchema} spec={spec} />
              </>
            ) : null}
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
  sharedExampleKey?: string
  onSelectExampleKey?: (value: string) => void
  selectedStatus?: string
  onSelectStatus?: (value: string) => void
}

export function EndpointResponse(arg0: EndpointResponseProps): ReactNode {
  const { spec, operation, sharedExampleKey, onSelectExampleKey, selectedStatus, onSelectStatus } = arg0

  return (
    <div className="mt-6">
      <Row className="relative">
        <Col>
          <div className="w-full">
            <ResponseList operation={operation} spec={spec} selectedStatus={selectedStatus} onSelectStatus={onSelectStatus} />
          </div>
        </Col>
        <Col sticky>
          <div className="w-full">
            <ResponseExamplesPanel
              operation={operation}
              spec={spec}
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
