import { useState } from 'react'

import { getMediaTypeEntries, getOperationParameters, getRequestBody } from '../lib/helpers'
import type { OpenAPIOperation, OpenAPIOperationSource, OpenAPISpec } from '../lib/utils'
import { emptyOpenApiCredentials, getOpenApiCredentialScope, useOpenApiStore } from '../store'
import type { OpenApiParameter, OpenApiServer, RequestAuthInputs } from '../types'

import { defaultServerVariables, getAuthOptions, getServerKey, getServers } from './ExamplePanels'
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
  authInput?: RequestAuthInputs
  onSelectAuth: (name: string) => void
  onChangeAuthValue: (name: string, value: string) => void
  onClearAuthValue: (name: string) => void
  onClearAuthValues: () => void
  onToggleAuth: () => void
  closeAuth: () => void
}

export function useOperationAuthState(spec: OpenAPISpec, operation: OpenAPIOperation): OperationAuthState {
  const authOptions = getAuthOptions(spec, operation)
  const [selectedAuthName, setSelectedAuthName] = useState(authOptions[0]?.key ?? '')
  const selectedAuth = authOptions.find((option) => option.key === selectedAuthName)
  const credentialScope = getOpenApiCredentialScope(spec)
  const authValues = useOpenApiStore((state) => state.credentials[credentialScope] ?? emptyOpenApiCredentials)
  const setCredential = useOpenApiStore((state) => state.setCredential)
  const clearCredential = useOpenApiStore((state) => state.clearCredential)
  const clearCredentials = useOpenApiStore((state) => state.clearCredentials)
  const [authOpen, setAuthOpen] = useState(false)
  const authInput: RequestAuthInputs | undefined = selectedAuth
    ? selectedAuth.schemes.map((option) => ({ name: option.name, scheme: option.scheme, value: authValues[option.name] ?? '' }))
    : undefined

  return {
    authOptions,
    selectedAuthName,
    selectedAuth,
    authValues,
    authOpen,
    authInput,
    onSelectAuth: setSelectedAuthName,
    onChangeAuthValue: (name, value) => setCredential(credentialScope, name, value),
    onClearAuthValue: (name) => clearCredential(credentialScope, name),
    onClearAuthValues: () => clearCredentials(credentialScope),
    onToggleAuth: () => setAuthOpen((current) => !current),
    closeAuth: () => setAuthOpen(false),
  }
}
