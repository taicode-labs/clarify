import { useState } from 'react'

import { getMediaTypeEntries, getOperationParameters, getRequestBody } from '../lib/helpers'
import type { OpenAPIOperation, OpenAPIOperationSource, OpenAPISpec } from '../lib/utils'
import type { OpenApiParameter, OpenApiServer, RequestAuthInput } from '../types'

import { authPlaceholder, defaultServerVariables, getAuthOptions, getServerKey, getServers } from './ExamplePanels'
import type { AuthOption } from './ExamplePanels'

export type OperationRequestState = {
  parameters: OpenApiParameter[]
  requestBody: ReturnType<typeof getRequestBody>
  requestContents: ReturnType<typeof getMediaTypeEntries>
  selectedRequestMediaType: string
  setSelectedRequestMediaType: (value: string) => void
  requestSchema: unknown
  groupedParameters: {
    path: OpenApiParameter[]
    query: OpenApiParameter[]
    header: OpenApiParameter[]
  }
}

export function useOperationRequestState(spec: OpenAPISpec, path: string, operation: OpenAPIOperation, source: OpenAPIOperationSource = 'path'): OperationRequestState {
  const parameters = getOperationParameters(spec, path, operation, source)
  const requestBody = getRequestBody(spec, operation)
  const requestContents = getMediaTypeEntries(requestBody?.content, spec)
  const [selectedRequestMediaType, setSelectedRequestMediaType] = useState(requestContents[0]?.mediaType ?? '')
  const selectedRequestContent = requestContents.find((content) => content.mediaType === selectedRequestMediaType) ?? requestContents[0]
  const requestSchema = selectedRequestContent?.value.schema
  const groupedParameters = {
    path: parameters.filter((parameter) => parameter.in === 'path'),
    query: parameters.filter((parameter) => parameter.in === 'query'),
    header: parameters.filter((parameter) => parameter.in === 'header'),
  }

  return {
    parameters,
    requestBody,
    requestContents,
    selectedRequestMediaType: selectedRequestContent?.mediaType ?? '',
    setSelectedRequestMediaType,
    requestSchema,
    groupedParameters,
  }
}

export type OperationServerState = {
  servers: OpenApiServer[]
  selectedServerKey: string
  selectedServer: OpenApiServer
  serverVariables: Record<string, string>
  serverOpen: boolean
  onSelectServer: (key: string) => void
  onChangeServerVariable: (name: string, value: string) => void
  onToggleServer: () => void
  closeServer: () => void
}

export function useOperationServerState(spec: OpenAPISpec, operation: OpenAPIOperation, path: string, source: OpenAPIOperationSource = 'path'): OperationServerState {
  const servers = getServers(spec, operation, path, source)
  const [selectedServerKey, setSelectedServerKey] = useState(getServerKey(servers[0], 0))
  const selectedServer = servers.find((server, index) => getServerKey(server, index) === selectedServerKey) ?? servers[0]
  const [serverVariables, setServerVariables] = useState(defaultServerVariables(selectedServer))
  const [serverOpen, setServerOpen] = useState(false)

  return {
    servers,
    selectedServerKey,
    selectedServer,
    serverVariables,
    serverOpen,
    onSelectServer: (value) => {
      const nextServer = servers.find((server, index) => getServerKey(server, index) === value) ?? servers[0]
      setSelectedServerKey(value)
      setServerVariables(defaultServerVariables(nextServer))
    },
    onChangeServerVariable: (name, value) => setServerVariables((current) => ({ ...current, [name]: value })),
    onToggleServer: () => setServerOpen((current) => !current),
    closeServer: () => setServerOpen(false),
  }
}

export type OperationAuthState = {
  authOptions: AuthOption[]
  selectedAuthName: string
  selectedAuth?: AuthOption
  authValues: Record<string, string>
  authOpen: boolean
  authInput?: RequestAuthInput
  onSelectAuth: (name: string) => void
  onChangeAuthValue: (name: string, value: string) => void
  onToggleAuth: () => void
  closeAuth: () => void
}

export function useOperationAuthState(spec: OpenAPISpec, operation: OpenAPIOperation): OperationAuthState {
  const authOptions = getAuthOptions(spec, operation)
  const [selectedAuthName, setSelectedAuthName] = useState(authOptions[0]?.name ?? '')
  const selectedAuth = authOptions.find((option) => option.name === selectedAuthName)
  const [authValues, setAuthValues] = useState<Record<string, string>>({})
  const [authOpen, setAuthOpen] = useState(false)
  const authInput: RequestAuthInput | undefined = selectedAuth
    ? { name: selectedAuth.name, scheme: selectedAuth.scheme, value: authValues[selectedAuth.name] ?? authPlaceholder(selectedAuth) }
    : undefined

  return {
    authOptions,
    selectedAuthName,
    selectedAuth,
    authValues,
    authOpen,
    authInput,
    onSelectAuth: setSelectedAuthName,
    onChangeAuthValue: (name, value) => setAuthValues((current) => ({ ...current, [name]: value })),
    onToggleAuth: () => setAuthOpen((current) => !current),
    closeAuth: () => setAuthOpen(false),
  }
}
