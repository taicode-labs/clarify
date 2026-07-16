import { useState } from 'react'

import { authPlaceholder, defaultServerVariables, getAuthOptions, getServerKey, getServers, RequestExamplesPanel, ResponseExamplesPanel } from '../openapi/components/ExamplePanels'
import { EndpointIdentity } from '../openapi/components/OpenApiOperation'
import { getMediaTypeEntries, getRequestBody } from '../openapi/lib/helpers'
import type { OpenAPIOperation, OpenAPISpec } from '../openapi/lib/utils'
import type { OpenApiParameter, RequestAuthInput } from '../openapi/types'

export type PreviewParameter = {
  name: string
  in: string
  type: string
  required?: boolean
  description?: string
  schema?: unknown
}

export type PreviewEndpoint = {
  method: string
  path: string
  summary: string
  description: string
  parameters?: PreviewParameter[]
  requestDescription?: string
  requestSchema?: unknown
  requestExample?: unknown
  response?: string
  responseStatus?: string
  responseDescription?: string
  responseSchema?: unknown
  responseExample?: unknown
}

type CreatePreviewOpenApiResult = {
  operation: OpenAPIOperation
  spec: OpenAPISpec
  parameters: OpenApiParameter[]
}

type OpenApiExamplesPreviewProps = { endpoint: PreviewEndpoint }

type UsePreviewRequestStateArgs = {
  spec: OpenAPISpec
  operation: OpenAPIOperation
}

function usePreviewRequestState(arg0: UsePreviewRequestStateArgs) {
  const { spec, operation } = arg0
  const requestBody = getRequestBody(spec, operation)
  const requestContents = getMediaTypeEntries(requestBody?.content, spec)
  const [selectedRequestMediaType, setSelectedRequestMediaType] = useState(requestContents[0]?.mediaType ?? '')
  const selectedRequestContent = requestContents.find((content) => content.mediaType === selectedRequestMediaType) ?? requestContents[0]

  return {
    requestContents,
    selectedRequestContent,
    setSelectedRequestMediaType,
  }
}

type UsePreviewIdentityStateArgs = {
  spec: OpenAPISpec
  operation: OpenAPIOperation
  path: string
}

function usePreviewIdentityState(arg0: UsePreviewIdentityStateArgs) {
  const { spec, operation, path } = arg0
  const servers = getServers(spec, operation, path)
  const [selectedServerKey, setSelectedServerKey] = useState(getServerKey(servers[0], 0))
  const selectedServer = servers.find((server, index) => getServerKey(server, index) === selectedServerKey) ?? servers[0]
  const [serverVariables, setServerVariables] = useState(defaultServerVariables(selectedServer))
  const [serverOpen, setServerOpen] = useState(false)

  const authOptions = getAuthOptions(spec, operation)
  const [selectedAuthName, setSelectedAuthName] = useState(authOptions[0]?.key ?? '')
  const selectedAuth = authOptions.find((option) => option.key === selectedAuthName)
  const [authValues, setAuthValues] = useState<Record<string, string>>({})
  const [authOpen, setAuthOpen] = useState(false)

  const authInput: RequestAuthInput[] | undefined = selectedAuth
    ? selectedAuth.schemes.map((option) => ({ name: option.name, scheme: option.scheme, value: authValues[option.name] ?? authPlaceholder(option) }))
    : undefined

  return {
    servers,
    selectedServerKey,
    selectedServer,
    serverVariables,
    serverOpen,
    authOptions,
    selectedAuthName,
    selectedAuth,
    authValues,
    authOpen,
    authInput,
    onSelectServer: (value: string) => {
      const nextServer = servers.find((server, index) => getServerKey(server, index) === value) ?? servers[0]
      setSelectedServerKey(value)
      setServerVariables(defaultServerVariables(nextServer))
    },
    onChangeServerVariable: (name: string, value: string) => {
      setServerVariables((current) => ({ ...current, [name]: value }))
    },
    onToggleServer: () => {
      setServerOpen((current) => !current)
      setAuthOpen(false)
    },
    onToggleAuth: () => {
      setAuthOpen((current) => !current)
      setServerOpen(false)
    },
    onSelectAuth: setSelectedAuthName,
    onChangeAuthValue: (name: string, value: string) => {
      setAuthValues((current) => ({ ...current, [name]: value }))
    },
    onClearAuthValue: (name: string) => {
      setAuthValues((current) => {
        const values = { ...current }
        delete values[name]
        return values
      })
    },
    onClearAuthValues: () => setAuthValues({}),
  }
}

function schemaFromType(type: string): unknown {
  if (type.endsWith('[]')) return { type: 'array', items: schemaFromType(type.slice(0, -2)) }
  if (type === 'number' || type === 'integer' || type === 'boolean' || type === 'object') return { type }
  return { type: 'string' }
}

function parseResponseExample(endpoint: PreviewEndpoint): unknown {
  if (typeof endpoint.responseExample !== 'undefined') return endpoint.responseExample
  if (!endpoint.response) return undefined

  try {
    return JSON.parse(endpoint.response)
  } catch {
    return endpoint.response
  }
}

function inferSchemaFromExample(example: unknown): unknown {
  if (Array.isArray(example)) {
    return { type: 'array', items: inferSchemaFromExample(example[0]) ?? { type: 'object' } }
  }

  if (typeof example === 'object' && example !== null) {
    return {
      type: 'object',
      properties: Object.fromEntries(Object.entries(example).map(([key, value]) => [key, inferSchemaFromExample(value)])),
    }
  }

  if (typeof example === 'number') return { type: Number.isInteger(example) ? 'integer' : 'number' }
  if (typeof example === 'boolean') return { type: 'boolean' }
  return typeof example === 'undefined' ? undefined : { type: 'string' }
}

function normalizeParameterLocation(location: string): string {
  return location === 'route' ? 'path' : location
}

function toOpenApiParameter(parameter: PreviewParameter): OpenApiParameter {
  return {
    name: parameter.name,
    in: normalizeParameterLocation(parameter.in),
    required: parameter.required,
    description: parameter.description,
    schema: parameter.schema ?? schemaFromType(parameter.type),
  }
}

function createPreviewOpenApi(endpoint: PreviewEndpoint): CreatePreviewOpenApiResult {
  const method = endpoint.method.toLowerCase()
  const parameters = (endpoint.parameters ?? []).map(toOpenApiParameter)
  const responseExample = parseResponseExample(endpoint)
  const responseSchema = endpoint.responseSchema ?? inferSchemaFromExample(responseExample)
  const requestSchema = endpoint.requestSchema ?? inferSchemaFromExample(endpoint.requestExample)
  const operation = {
    summary: endpoint.summary,
    description: endpoint.description,
    parameters,
    requestBody: requestSchema
      ? {
          description: endpoint.requestDescription,
          required: true,
          content: {
            'application/json': {
              schema: requestSchema,
              example: endpoint.requestExample,
            },
          },
        }
      : undefined,
    responses: {
      [endpoint.responseStatus ?? '200']: {
        description: endpoint.responseDescription ?? 'OK',
        content: {
          'application/json': {
            schema: responseSchema,
            example: responseExample,
          },
        },
      },
    },
  } as OpenAPIOperation
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Clarify Build API',
      version: '2026-06-20',
      description: 'API reference generated from OpenAPI and rendered as static documentation.',
    },
    servers: [
      {
        url: 'https://server',
        description: 'Production',
      },
      {
        url: 'https://test-server',
        description: 'Test',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      [endpoint.path]: {
        [method]: operation,
      },
    },
  } as OpenAPISpec

  return { operation, spec, parameters }
}

export function OpenApiExamplesPreview(arg0: OpenApiExamplesPreviewProps) {
  const { endpoint } = arg0
  const { operation, spec, parameters } = createPreviewOpenApi(endpoint)
  const method = endpoint.method.toUpperCase()
  const { requestContents, selectedRequestContent, setSelectedRequestMediaType } = usePreviewRequestState({ spec, operation })
  const identityState = usePreviewIdentityState({ spec, operation, path: endpoint.path })

  function renderIdentity() {
    return (
      <EndpointIdentity
        method={method}
        path={endpoint.path}
        operationSource="path"
        servers={identityState.servers}
        selectedServerKey={identityState.selectedServerKey}
        selectedServer={identityState.selectedServer}
        serverVariables={identityState.serverVariables}
        serverOpen={identityState.serverOpen}
        onSelectServer={identityState.onSelectServer}
        onChangeServerVariable={identityState.onChangeServerVariable}
        onToggleServer={identityState.onToggleServer}
      />
    )
  }

  function renderExamples() {
    return (
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <RequestExamplesPanel
          spec={spec}
          path={endpoint.path}
          method={method}
          parameters={parameters}
          requestContents={requestContents}
          selectedMediaType={selectedRequestContent?.mediaType ?? ''}
          onSelectMediaType={setSelectedRequestMediaType}
          selectedServer={identityState.selectedServer}
          serverVariables={identityState.serverVariables}
          auth={identityState.authInput}
        />
        <ResponseExamplesPanel operation={operation} spec={spec} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {renderIdentity()}
      {renderExamples()}
    </div>
  )
}
