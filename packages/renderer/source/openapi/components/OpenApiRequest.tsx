import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import clsx from 'clsx'
import { EraserIcon, LoaderCircleIcon, PlayIcon, RotateCcwIcon, XIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { HighlightedCode } from '../../components/HighlightedCode'
import { useBuiltInText } from '../../core/i18n'
import { executeApiRequest, type ApiResponseExchange } from '../lib/api-exchange'
import { buildApiRequest, parameterKey } from '../lib/api-request'
import { getExampleEntries, getMediaTypeEntries, getOperationParameters, getRequestBody, isRecord, resolveSchema, stringifyExample } from '../lib/helpers'
import { buildRequestCodeExamples } from '../lib/request-code'
import { validateRequestParameters, type RequestParameterIssue } from '../lib/request-parameters'
import type { OpenAPIOperation, OpenAPIOperationSource, OpenAPISpec } from '../lib/utils'
import { emptyOpenApiCredentials, getOpenApiCredentialScope, useOpenApiStore } from '../store'
import type { OpenApiParameter } from '../types'

import { defaultServerVariables, getAuthOptions, getServerKey, getServers } from './ExamplePanels'
import { InlineListbox } from './InlineListbox'
import { OpenApiAuthPanel } from './OpenApiAuthPanel'
import { RequestField, RequestSection } from './OpenApiRequestFields'
import { OpenApiResponseViewer } from './OpenApiResponseViewer'

type OpenApiRequestWorkbenchProps = {
  spec: OpenAPISpec
  path: string
  method: string
  operation: OpenAPIOperation
  operationSource?: OpenAPIOperationSource
  compact?: boolean
}

type OpenApiRequestDialogProps = OpenApiRequestWorkbenchProps & {
  open: boolean
  onClose: () => void
}

function initialParameterValue(spec: OpenAPISpec, parameter: OpenApiParameter): string {
  const schema = resolveSchema(spec, parameter.schema)
  if (!isRecord(schema)) return ''
  const value = schema.example ?? schema.default ?? (Array.isArray(schema.enum) ? schema.enum[0] : undefined)
  return stringifyExample(value)
}

function parameterGroupLabel(location: string, t: ReturnType<typeof useBuiltInText>): string {
  if (location === 'path') return t('openapi.pathParameters')
  if (location === 'header') return t('openapi.headers')
  if (location === 'cookie') return t('openapi.cookies')
  return t('openapi.queryParameters')
}

function requestUrl(serverUrl: string, variables: Record<string, string>, path: string): string {
  const base = serverUrl.replace(/\{([^}]+)\}/g, (_, name: string) => variables[name] ?? `{${name}}`).replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function OpenApiRequestWorkbench(arg0: OpenApiRequestWorkbenchProps): ReactNode {
  const { spec, path, method, operation, operationSource = 'path', compact = false } = arg0
  const t = useBuiltInText()
  const parameters = getOperationParameters(spec, path, operation, operationSource)
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
  const clearCredentials = useOpenApiStore((state) => state.clearCredentials)
  const requestContents = getMediaTypeEntries(getRequestBody(spec, operation)?.content, spec)
  const [mediaType, setMediaType] = useState(requestContents[0]?.mediaType ?? '')
  const selectedContent = requestContents.find((entry) => entry.mediaType === mediaType) ?? requestContents[0]
  const initialBody = stringifyExample(getExampleEntries(selectedContent?.value, spec)[0]?.value)
  const [body, setBody] = useState(initialBody)
  const [parameterValues, setParameterValues] = useState<Record<string, string>>(() => Object.fromEntries(parameters.map((parameter) => [parameterKey(parameter), initialParameterValue(spec, parameter)])))
  const [parameterEnabled, setParameterEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(parameters.map((parameter) => [parameterKey(parameter), true])))
  const [parameterIssues, setParameterIssues] = useState<Record<string, RequestParameterIssue>>({})
  const [exchange, setExchange] = useState<ApiResponseExchange>()
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const requestController = useRef<AbortController>(null)
  const parameterGroups = ['cookie', 'header', 'query'].map((location) => ({
    location,
    parameters: parameters.filter((parameter) => parameter.in === location),
  })).filter((group) => group.parameters.length > 0)
  const pathParameters = parameters.filter((parameter) => parameter.in === 'path')
  const variableCount = Object.keys(selectedServer.variables ?? {}).length + pathParameters.length
  const codeExamples = buildRequestCodeExamples({
    spec,
    path,
    method,
    parameters,
    requestContent: selectedContent ? { mediaType: selectedContent.mediaType, value: selectedContent.value } : undefined,
    server: selectedServer,
    serverVariables,
    auth: selectedAuth?.schemes.map((option) => ({ name: option.name, scheme: option.scheme, value: credentials[option.name] ?? '' })),
    operationSource,
  })
  const [selectedCodeKey, setSelectedCodeKey] = useState(codeExamples[0]?.key ?? '')
  const selectedCode = codeExamples.find((example) => example.key === selectedCodeKey) ?? codeExamples[0]

  useEffect(() => () => requestController.current?.abort(), [])

  async function sendRequest() {
    const enabledParameters = parameters.filter((parameter) => parameterEnabled[parameterKey(parameter)] !== false)
    const issues = validateRequestParameters(spec, enabledParameters, parameterValues)
    setParameterIssues(issues)
    if (Object.keys(issues).length > 0) return

    requestController.current?.abort()
    const controller = new AbortController()
    requestController.current = controller
    setSending(true)
    setError('')
    setExchange(undefined)

    try {
      const request = buildApiRequest({
        method,
        path,
        server: selectedServer,
        serverVariables,
        parameters,
        parameterValues,
        parameterEnabled,
        auth: selectedAuth?.schemes.map((option) => ({ scheme: option.scheme, value: credentials[option.name] ?? '' })),
        mediaType,
        body,
        baseUrl: window.location.href,
      })
      setExchange(await executeApiRequest(request, { signal: controller.signal }))
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      const message = cause instanceof Error ? cause.message : String(cause)
      setError(`${message}. ${t('openapi.requestCorsHint')}`)
    } finally {
      if (requestController.current === controller) {
        requestController.current = null
        setSending(false)
      }
    }
  }

  function setParameterGroupValues(grouped: OpenApiParameter[], mode: 'reset' | 'clear') {
    const keys = new Set(grouped.map(parameterKey))
    setParameterValues((current) => ({
      ...current,
      ...Object.fromEntries(grouped.map((parameter) => [parameterKey(parameter), mode === 'reset' ? initialParameterValue(spec, parameter) : ''])),
    }))
    setParameterIssues((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !keys.has(key))))
  }

  function setParameterIncluded(parameter: OpenApiParameter, enabled: boolean) {
    const key = parameterKey(parameter)
    setParameterEnabled((current) => ({ ...current, [key]: enabled }))
    if (!enabled) {
      setParameterIssues((current) => {
        const next = { ...current }
        delete next[key]
        return next
      })
    }
  }

  return (
    <div className={clsx('clarify-api-request not-prose overflow-hidden border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface)', compact ? 'rounded-lg' : 'my-6 rounded-xl shadow-xs')}>
      <div className="flex min-w-0 items-center gap-2 border-b border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) px-3 py-2.5">
        <span className="rounded-md bg-(--clarify-theme-tokens-colors-primary) px-2.5 py-1.5 text-xs font-black text-white">{method.toUpperCase()}</span>
        <span className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-ui-subtle-background) px-3 py-2 font-mono text-xs text-(--clarify-theme-tokens-colors-foreground)">{requestUrl(selectedServer.url ?? '', serverVariables, path)}</span>
        <button
          type="button"
          disabled={sending}
          onClick={sendRequest}
          className="flex h-9 shrink-0 items-center gap-2 rounded-md bg-(--clarify-theme-tokens-colors-primary) px-3 text-xs font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary) focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
        >
          {sending ? <LoaderCircleIcon className="h-4 w-4 animate-spin" aria-hidden="true" /> : <PlayIcon className="h-4 w-4 fill-current" aria-hidden="true" />}
          {sending ? t('openapi.sendingRequest') : t('openapi.sendRequest')}
        </button>
      </div>

      <div className="grid min-h-136 lg:grid-cols-2">
        <div className="min-w-0 overflow-y-auto lg:max-h-[calc(100vh-8rem)] lg:border-r lg:border-(--clarify-theme-tokens-colors-border)">
          {authOptions.length > 0 ? <RequestSection title={t('openapi.authentication')} count={selectedAuth?.schemes.length ?? 0} defaultOpen>
            <OpenApiAuthPanel embedded authOptions={authOptions} selectedAuthName={selectedAuthName} selectedAuth={selectedAuth} authValues={credentials} onSelectAuth={setSelectedAuthName} onChangeAuthValue={(name, value) => setCredential(credentialScope, name, value)} onClearAuthValue={(name) => clearCredential(credentialScope, name)} onClearAuthValues={() => clearCredentials(credentialScope)} />
          </RequestSection> : null}

          {servers.length > 1 || variableCount > 0 ? <RequestSection title={t('openapi.variables')} count={variableCount} defaultOpen>
            {servers.length > 1 ? (
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className="text-xs font-semibold text-(--clarify-ui-text-soft)">{t('openapi.server')}</span>
                <InlineListbox
                  label={t('openapi.server')}
                  value={selectedServerKey}
                  options={servers.map((server, index) => ({ value: getServerKey(server, index), label: server.description ?? server.url ?? `Server ${index + 1}` }))}
                  onChange={(value) => {
                    const nextServer = servers.find((server, index) => getServerKey(server, index) === value) ?? servers[0]
                    setSelectedServerKey(value)
                    setServerVariables(defaultServerVariables(nextServer))
                  }}
                />
              </label>
            ) : null}
            {Object.entries(selectedServer.variables ?? {}).map(([name, variable]) => (
            <label key={name} className="flex min-w-0 flex-col gap-1.5">
              <span className="text-xs font-semibold text-(--clarify-ui-text-soft)">{name}</span>
              <input value={serverVariables[name] ?? variable.default ?? ''} onChange={(event) => setServerVariables((current) => ({ ...current, [name]: event.target.value }))} className="h-9 rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) px-2.5 font-mono text-xs outline-hidden focus:border-(--clarify-theme-tokens-colors-primary)" />
            </label>
          ))}
            {pathParameters.map((parameter) => { const key = parameterKey(parameter); return <RequestField key={key} spec={spec} parameter={parameter} value={parameterValues[key] ?? ''} enabled={parameterEnabled[key] !== false} issue={parameterIssues[key]} onEnabledChange={(enabled) => setParameterIncluded(parameter, enabled)} onChange={(value) => { setParameterValues((current) => ({ ...current, [key]: value })); setParameterIssues((current) => { const next = { ...current }; delete next[key]; return next }) }} /> })}
          </RequestSection> : null}

          {parameterGroups.map(({ location, parameters: grouped }) => <RequestSection key={location} title={parameterGroupLabel(location, t)} count={grouped.length} table={location !== 'cookie'} defaultOpen={location === 'path' || grouped.some((parameter) => parameter.required)} actions={location === 'cookie' ? undefined : <><button type="button" title={t('openapi.resetToExample')} aria-label={t('openapi.resetToExample')} onClick={() => setParameterGroupValues(grouped, 'reset')} className="grid size-7 place-items-center rounded-md text-(--clarify-ui-text-faint) hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-ui-text-strong) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)"><RotateCcwIcon className="size-3.5" aria-hidden="true" /></button><button type="button" title={t('openapi.clear')} aria-label={t('openapi.clear')} onClick={() => setParameterGroupValues(grouped, 'clear')} className="grid size-7 place-items-center rounded-md text-(--clarify-ui-text-faint) hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-ui-text-strong) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)"><EraserIcon className="size-3.5" aria-hidden="true" /></button></>}>{location === 'cookie' ? <p className="sm:col-span-2 text-xs/5 text-(--clarify-ui-text-faint)">{t('openapi.cookieParametersBrowserManaged')}</p> : grouped.map((parameter) => { const key = parameterKey(parameter); return <RequestField key={key} spec={spec} parameter={parameter} value={parameterValues[key] ?? ''} enabled={parameterEnabled[key] !== false} issue={parameterIssues[key]} onEnabledChange={(enabled) => setParameterIncluded(parameter, enabled)} onChange={(value) => { setParameterValues((current) => ({ ...current, [key]: value })); setParameterIssues((current) => { const next = { ...current }; delete next[key]; return next }) }} /> })}</RequestSection>)}

          {requestContents.length > 0 ? (
            <RequestSection title={t('openapi.requestBody')} count={1} defaultOpen>
              <label className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-semibold text-(--clarify-ui-text-soft)">{t('openapi.requestBody')}</span>
              {requestContents.length > 1 ? <InlineListbox label={t('openapi.mediaType')} value={mediaType} options={requestContents.map((entry) => ({ value: entry.mediaType, label: entry.mediaType }))} onChange={(value) => { setMediaType(value); setBody(stringifyExample(getExampleEntries(requestContents.find((entry) => entry.mediaType === value)?.value, spec)[0]?.value)) }} /> : null}
              <textarea value={body} onChange={(event) => setBody(event.target.value)} spellCheck={false} className="min-h-44 resize-y rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-code-background) p-3 font-mono text-xs/5 text-(--clarify-code-text) outline-hidden focus:border-(--clarify-theme-tokens-colors-primary)" />
            </label>
            </RequestSection>
          ) : null}

          {selectedCode ? <RequestSection title={t('openapi.codeSnippet')} defaultOpen={false}>
            <div className="overflow-hidden rounded-md border border-(--clarify-code-border) bg-(--clarify-code-background) sm:col-span-2">
              <div className="border-b border-(--clarify-code-border) p-2"><InlineListbox label={t('openapi.codeSnippet')} value={selectedCode.key} options={codeExamples.map((example) => ({ value: example.key, label: `${example.title} · ${example.clientTitle}` }))} onChange={setSelectedCodeKey} /></div>
              <pre className="max-h-80 overflow-auto p-3 text-xs/5 text-(--clarify-code-text)"><HighlightedCode code={selectedCode.code} language={selectedCode.language} /></pre>
            </div>
          </RequestSection> : null}
        </div>

        <OpenApiResponseViewer exchange={exchange} error={error} />
      </div>
    </div>
  )
}

export function OpenApiRequestDialog(arg0: OpenApiRequestDialogProps): ReactNode {
  const { open, onClose, ...workbenchProps } = arg0
  const t = useBuiltInText()

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/55 backdrop-blur-sm" />
      <div className="fixed inset-0 overflow-y-auto p-3 sm:p-6">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel className="relative w-full max-w-[min(96rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg bg-(--clarify-theme-tokens-colors-background) shadow-2xl ring-1 ring-white/10">
            <DialogTitle className="sr-only">{t('openapi.tryRequest')}</DialogTitle>
            <button type="button" onClick={onClose} aria-label={t('openapi.closeRequest')} className="absolute top-3 right-3 z-10 grid size-8 place-items-center rounded-md bg-(--clarify-ui-subtle-background) text-(--clarify-ui-text-soft) transition hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-theme-tokens-colors-foreground) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)"><XIcon className="size-4" aria-hidden="true" /></button>
            <OpenApiRequestWorkbench {...workbenchProps} compact />
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
