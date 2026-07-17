import { useEffect, useRef, useState } from 'react'

import { executeApiRequest, type ApiResponseExchange } from '../lib/api-exchange'
import { parameterKey } from '../lib/api-request'
import { getExampleEntries, getMediaTypeEntries, getParameterExampleEntries, getRequestBody, isRecord, resolveSchema, stringifyExample } from '../lib/helpers'
import { validateRequestParameters, type RequestParameterIssue } from '../lib/request-parameters'
import type { OpenAPIOperation, OpenAPIOperationSource, OpenAPISpec } from '../lib/utils'
import { emptyOpenApiCredentials, getOpenApiCredentialScope, useOpenApiStore } from '../store'
import type { OpenApiMediaType, OpenApiParameter } from '../types'

import { defaultServerVariables, getAuthOptions, getServerKey, getServers } from './ExamplePanels'

export function initialRequestBody(spec: OpenAPISpec, content?: OpenApiMediaType): string {
  const example = getExampleEntries(content, spec)[0]
  if (!example?.generated) return stringifyExample(example?.value)

  const schema = resolveSchema(spec, content?.schema)
  if (isRecord(schema) && schema.format === 'binary') return ''
  if (!isRecord(example.value) || !isRecord(schema) || !isRecord(schema.properties)) return stringifyExample(example.value)

  const value = { ...example.value }
  Object.entries(schema.properties).forEach(([name, propertySchema]) => {
    const resolved = resolveSchema(spec, propertySchema)
    if (isRecord(resolved) && resolved.format === 'binary') delete value[name]
  })
  return stringifyExample(value)
}

export function requestBodyForExample(spec: OpenAPISpec, content: OpenApiMediaType | undefined, exampleKey: string): string {
  const example = getExampleEntries(content, spec).find((entry) => !entry.generated && entry.key === exampleKey)
  return example ? stringifyExample(example.value) : initialRequestBody(spec, content)
}

export function useOpenApiRequestTarget(spec: OpenAPISpec, path: string, operation: OpenAPIOperation, operationSource: OpenAPIOperationSource) {
  const servers = getServers(spec, operation, path, operationSource)
  const [selectedServerKey, setSelectedServerKey] = useState(getServerKey(servers[0], 0))
  const selectedServer = servers.find((server, index) => getServerKey(server, index) === selectedServerKey) ?? servers[0]
  const [serverVariables, setServerVariables] = useState(defaultServerVariables(selectedServer))
  const authOptions = getAuthOptions(spec, operation)
  const [selectedAuthName, setSelectedAuthName] = useState(authOptions[0]?.key ?? '')
  const selectedAuth = authOptions.find((option) => option.key === selectedAuthName)
  const credentialScope = getOpenApiCredentialScope(spec)
  const credentials = useOpenApiStore((state) => state.credentials[credentialScope] ?? emptyOpenApiCredentials)
  const setCredential = useOpenApiStore((state) => state.setCredential)
  const clearCredential = useOpenApiStore((state) => state.clearCredential)
  const requestContents = getMediaTypeEntries(getRequestBody(spec, operation)?.content, spec)
  const [mediaType, setMediaType] = useState(requestContents[0]?.mediaType ?? '')
  const selectedContent = requestContents.find((entry) => entry.mediaType === mediaType) ?? requestContents[0]
  const [body, setBody] = useState(initialRequestBody(spec, selectedContent?.value))
  const [bodyFiles, setBodyFiles] = useState<Record<string, File>>({})

  function selectServer(value: string) {
    const nextServer = servers.find((server, index) => getServerKey(server, index) === value) ?? servers[0]
    setSelectedServerKey(value)
    setServerVariables(defaultServerVariables(nextServer))
  }

  function selectMediaType(value: string) {
    const content = requestContents.find((entry) => entry.mediaType === value)?.value
    setMediaType(value)
    setBody(initialRequestBody(spec, content))
    setBodyFiles({})
  }

  function applyBodyExample(exampleKey: string) {
    setBody(requestBodyForExample(spec, selectedContent?.value, exampleKey))
    setBodyFiles({})
  }

  function setBodyFile(name: string, file?: File) {
    setBodyFiles((current) => {
      const next = { ...current }
      if (file) next[name] = file
      else delete next[name]
      return next
    })
  }

  return {
    servers,
    selectedServer,
    selectedServerKey,
    serverVariables,
    setServerVariables,
    serverVariableEntries: Object.entries(selectedServer.variables ?? {}),
    selectServer,
    authOptions,
    selectedAuthName,
    setSelectedAuthName,
    selectedAuth,
    credentialScope,
    credentials,
    setCredential,
    clearCredential,
    requestContents,
    mediaType,
    selectedContent,
    body,
    setBody,
    bodyFiles,
    setBodyFile,
    applyBodyExample,
    selectMediaType,
  }
}

export function useOpenApiParameterState(spec: OpenAPISpec, parameters: OpenApiParameter[], initialParameterValue: (parameter: OpenApiParameter) => string, initialExampleKey = '') {
  const [parameterValues, setParameterValues] = useState<Record<string, string>>(() => Object.fromEntries(parameters.map((parameter) => {
    const example = getParameterExampleEntries(parameter).find((entry) => entry.key === initialExampleKey)
    return [parameterKey(parameter), example ? stringifyExample(example.value) : initialParameterValue(parameter)]
  })))
  const [parameterEnabled, setParameterEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(parameters.map((parameter) => [parameterKey(parameter), true])))
  const [parameterIssues, setParameterIssues] = useState<Record<string, RequestParameterIssue>>({})

  function setParameterGroupValues(grouped: OpenApiParameter[], mode: 'reset' | 'clear') {
    const keys = new Set(grouped.map(parameterKey))
    setParameterValues((current) => ({ ...current, ...Object.fromEntries(grouped.map((parameter) => [parameterKey(parameter), mode === 'reset' ? initialParameterValue(parameter) : ''])) }))
    setParameterIssues((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !keys.has(key))))
  }

  function setParameterIncluded(parameter: OpenApiParameter, enabled: boolean) {
    const key = parameterKey(parameter)
    setParameterEnabled((current) => ({ ...current, [key]: enabled }))
    if (!enabled) setParameterIssues((current) => { const next = { ...current }; delete next[key]; return next })
  }

  function updateParameterValue(parameter: OpenApiParameter, value: string) {
    const key = parameterKey(parameter)
    setParameterValues((current) => ({ ...current, [key]: value }))
    setParameterIssues((current) => { const next = { ...current }; delete next[key]; return next })
  }

  function applyParameterExample(exampleKey: string) {
    setParameterValues(Object.fromEntries(parameters.map((parameter) => {
      const example = getParameterExampleEntries(parameter).find((entry) => entry.key === exampleKey)
      return [parameterKey(parameter), example ? stringifyExample(example.value) : initialParameterValue(parameter)]
    })))
    setParameterIssues({})
  }

  function validate(parametersToValidate: OpenApiParameter[]) {
    const issues = validateRequestParameters(spec, parametersToValidate, parameterValues)
    setParameterIssues(issues)
    return issues
  }

  return { parameterValues, parameterEnabled, parameterIssues, setParameterGroupValues, setParameterIncluded, updateParameterValue, applyParameterExample, validate }
}

export function useOpenApiRequestExecution() {
  const [exchange, setExchange] = useState<ApiResponseExchange>()
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const requestController = useRef<AbortController>(null)
  useEffect(() => () => requestController.current?.abort(), [])

  async function execute(request: Parameters<typeof executeApiRequest>[0], corsHint: string) {
    requestController.current?.abort()
    const controller = new AbortController()
    requestController.current = controller
    setSending(true)
    setError('')
    setExchange(undefined)
    try {
      setExchange(await executeApiRequest(request, { signal: controller.signal }))
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      const message = cause instanceof Error ? cause.message : String(cause)
      setError(`${message}. ${corsHint}`)
    } finally {
      if (requestController.current === controller) {
        requestController.current = null
        setSending(false)
      }
    }
  }

  return { exchange, error, sending, execute }
}
