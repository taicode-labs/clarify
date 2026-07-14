import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import clsx from 'clsx'
import { AlertCircleIcon, LoaderCircleIcon, PlayIcon, XIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { useBuiltInText } from '../../core/i18n'
import { buildApiRequest, parameterKey } from '../lib/api-request'
import { getExampleEntries, getMediaTypeEntries, getOperationParameters, getRequestBody, isRecord, stringifyExample } from '../lib/helpers'
import type { OpenAPIOperation, OpenAPIOperationSource, OpenAPISpec } from '../lib/utils'
import type { OpenApiParameter } from '../types'

import { authPlaceholder, defaultServerVariables, getAuthOptions, getServerKey, getServers } from './ExamplePanels'
import { InlineListbox } from './InlineListbox'

type ApiRequestWorkbenchProps = {
  spec: OpenAPISpec
  path: string
  method: string
  operation: OpenAPIOperation
  operationSource?: OpenAPIOperationSource
  compact?: boolean
}

type ApiRequestDialogProps = ApiRequestWorkbenchProps & {
  open: boolean
  onClose: () => void
}

type RequestResult = {
  status: number
  statusText: string
  duration: number
  headers: Array<[string, string]>
  body: string
}

type RequestFieldProps = {
  parameter: OpenApiParameter
  value: string
  onChange: (value: string) => void
}

function currentTime(): number {
  return performance.now()
}

function initialParameterValue(parameter: OpenApiParameter): string {
  if (!isRecord(parameter.schema)) return ''
  const value = parameter.schema.example ?? parameter.schema.default ?? (Array.isArray(parameter.schema.enum) ? parameter.schema.enum[0] : undefined)
  return typeof value === 'undefined' ? '' : String(value)
}

function formatResponseBody(body: string, contentType: string | null): string {
  if (!body || !contentType?.includes('json')) return body
  try {
    return JSON.stringify(JSON.parse(body), null, 2)
  } catch {
    return body
  }
}

function RequestField(arg0: RequestFieldProps): ReactNode {
  const { parameter, value, onChange } = arg0
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-(--clarify-ui-text-soft)">
        <span className="truncate">{parameter.name}</span>
        <span className="rounded bg-(--clarify-ui-subtle-background) px-1.5 py-0.5 font-mono text-2xs uppercase text-(--clarify-ui-text-faint)">{parameter.in}</span>
        {parameter.required ? <span className="text-red-500">*</span> : null}
      </span>
      <input
        value={value}
        required={parameter.required}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) px-2.5 font-mono text-xs text-(--clarify-theme-tokens-colors-foreground) outline-hidden transition placeholder:text-(--clarify-ui-text-faint) focus:border-(--clarify-theme-tokens-colors-primary) focus:ring-2 focus:ring-(--clarify-theme-tokens-colors-primary)/15"
        placeholder={parameter.required ? 'Required' : 'Optional'}
      />
    </label>
  )
}

export function ApiRequestWorkbench(arg0: ApiRequestWorkbenchProps): ReactNode {
  const { spec, path, method, operation, operationSource = 'path', compact = false } = arg0
  const t = useBuiltInText()
  const parameters = getOperationParameters(spec, path, operation, operationSource)
  const servers = getServers(spec, operation, path, operationSource)
  const [selectedServerKey, setSelectedServerKey] = useState(getServerKey(servers[0], 0))
  const selectedServer = servers.find((server, index) => getServerKey(server, index) === selectedServerKey) ?? servers[0]
  const [serverVariables, setServerVariables] = useState(defaultServerVariables(selectedServer))
  const authOptions = getAuthOptions(spec, operation)
  const [selectedAuthName, setSelectedAuthName] = useState(authOptions[0]?.name ?? '')
  const selectedAuth = authOptions.find((option) => option.name === selectedAuthName)
  const [authValue, setAuthValue] = useState('')
  const requestContents = getMediaTypeEntries(getRequestBody(spec, operation)?.content, spec)
  const [mediaType, setMediaType] = useState(requestContents[0]?.mediaType ?? '')
  const selectedContent = requestContents.find((entry) => entry.mediaType === mediaType) ?? requestContents[0]
  const initialBody = stringifyExample(getExampleEntries(selectedContent?.value, spec)[0]?.value)
  const [body, setBody] = useState(initialBody)
  const [parameterValues, setParameterValues] = useState<Record<string, string>>(() => Object.fromEntries(parameters.map((parameter) => [parameterKey(parameter), initialParameterValue(parameter)])))
  const [result, setResult] = useState<RequestResult>()
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function sendRequest() {
    setSending(true)
    setError('')
    setResult(undefined)
    const startedAt = currentTime()

    try {
      const request = buildApiRequest({
        method,
        path,
        server: selectedServer,
        serverVariables,
        parameters,
        parameterValues,
        auth: selectedAuth ? { scheme: selectedAuth.scheme, value: authValue } : undefined,
        mediaType,
        body,
        baseUrl: window.location.href,
      })
      const response = await fetch(request.url, request.init)
      const responseBody = await response.text()
      setResult({
        status: response.status,
        statusText: response.statusText,
        duration: Math.round(currentTime() - startedAt),
        headers: Array.from(response.headers.entries()),
        body: formatResponseBody(responseBody, response.headers.get('content-type')),
      })
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause)
      setError(`${message}. ${t('openapi.requestCorsHint')}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={clsx('clarify-api-request not-prose overflow-hidden border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface)', compact ? 'rounded-lg' : 'my-6 rounded-xl shadow-xs')}>
      <div className="flex min-w-0 items-center gap-2 border-b border-(--clarify-theme-tokens-colors-border) bg-(--clarify-ui-subtle-background) px-3 py-2.5">
        <span className="rounded-md bg-(--clarify-theme-tokens-colors-primary) px-2 py-1 text-xs font-black text-white">{method.toUpperCase()}</span>
        <span className="min-w-0 flex-1 truncate font-mono text-xs font-semibold text-(--clarify-theme-tokens-colors-foreground)">{path}</span>
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

      <div className="grid min-h-80 lg:grid-cols-2">
        <div className="space-y-5 p-4 lg:border-r lg:border-(--clarify-theme-tokens-colors-border)">
          <div className="grid gap-3 sm:grid-cols-2">
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
            {authOptions.length > 0 ? (
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className="text-xs font-semibold text-(--clarify-ui-text-soft)">{t('openapi.authentication')}</span>
                <InlineListbox
                  label={t('openapi.authentication')}
                  value={selectedAuthName}
                  options={authOptions.map((option) => ({ value: option.name, label: option.name }))}
                  onChange={setSelectedAuthName}
                />
              </label>
            ) : null}
          </div>

          {Object.entries(selectedServer.variables ?? {}).map(([name, variable]) => (
            <label key={name} className="flex min-w-0 flex-col gap-1.5">
              <span className="text-xs font-semibold text-(--clarify-ui-text-soft)">{name}</span>
              <input value={serverVariables[name] ?? variable.default ?? ''} onChange={(event) => setServerVariables((current) => ({ ...current, [name]: event.target.value }))} className="h-9 rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) px-2.5 font-mono text-xs outline-hidden focus:border-(--clarify-theme-tokens-colors-primary)" />
            </label>
          ))}

          {selectedAuth ? (
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-xs font-semibold text-(--clarify-ui-text-soft)">{t('openapi.credential')}</span>
              <input type="password" value={authValue} onChange={(event) => setAuthValue(event.target.value)} placeholder={authPlaceholder(selectedAuth)} className="h-9 rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) px-2.5 font-mono text-xs outline-hidden focus:border-(--clarify-theme-tokens-colors-primary)" />
            </label>
          ) : null}

          {parameters.length > 0 ? <div className="grid gap-3 sm:grid-cols-2">{parameters.map((parameter) => <RequestField key={parameterKey(parameter)} parameter={parameter} value={parameterValues[parameterKey(parameter)] ?? ''} onChange={(value) => setParameterValues((current) => ({ ...current, [parameterKey(parameter)]: value }))} />)}</div> : null}

          {requestContents.length > 0 ? (
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-xs font-semibold text-(--clarify-ui-text-soft)">{t('openapi.requestBody')}</span>
              {requestContents.length > 1 ? <InlineListbox label={t('openapi.mediaType')} value={mediaType} options={requestContents.map((entry) => ({ value: entry.mediaType, label: entry.mediaType }))} onChange={(value) => { setMediaType(value); setBody(stringifyExample(getExampleEntries(requestContents.find((entry) => entry.mediaType === value)?.value, spec)[0]?.value)) }} /> : null}
              <textarea value={body} onChange={(event) => setBody(event.target.value)} spellCheck={false} className="min-h-44 resize-y rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-code-background) p-3 font-mono text-xs/5 text-(--clarify-code-text) outline-hidden focus:border-(--clarify-theme-tokens-colors-primary)" />
            </label>
          ) : null}
        </div>

        <div className="min-w-0 bg-(--clarify-code-background) p-4 text-(--clarify-code-text)">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-xs font-bold uppercase text-(--clarify-code-muted)">{t('openapi.response')}</h3>
            {result ? <span className={clsx('rounded px-2 py-1 text-xs font-bold', result.status < 400 ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300')}>{result.status} {result.statusText} · {result.duration} ms</span> : null}
          </div>
          {error ? <div className="flex gap-2 rounded-md border border-red-400/20 bg-red-400/10 p-3 text-xs/5 text-red-200"><AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{error}</span></div> : null}
          {!error && !result ? <div className="grid min-h-56 place-items-center text-center text-xs text-(--clarify-code-faint)">{t('openapi.responseEmpty')}</div> : null}
          {result ? (
            <div className="space-y-4">
              {result.headers.length > 0 ? <details><summary className="cursor-pointer text-xs font-semibold text-(--clarify-code-muted)">{t('openapi.headers')} ({result.headers.length})</summary><pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-2xs/5">{result.headers.map(([name, value]) => `${name}: ${value}`).join('\n')}</pre></details> : null}
              <pre className="max-h-128 overflow-auto whitespace-pre-wrap wrap-break-word font-mono text-xs/5">{result.body || t('openapi.responseBodyEmpty')}</pre>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function ApiRequestDialog(arg0: ApiRequestDialogProps): ReactNode {
  const { open, onClose, ...workbenchProps } = arg0
  const t = useBuiltInText()

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/55 backdrop-blur-sm" />
      <div className="fixed inset-0 overflow-y-auto p-3 sm:p-6">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel className="relative w-full max-w-6xl overflow-hidden rounded-xl bg-(--clarify-theme-tokens-colors-background) shadow-2xl ring-1 ring-white/10">
            <DialogTitle className="sr-only">{t('openapi.tryRequest')}</DialogTitle>
            <button type="button" onClick={onClose} aria-label={t('openapi.closeRequest')} className="absolute top-3 right-3 z-10 grid size-8 place-items-center rounded-md bg-(--clarify-ui-subtle-background) text-(--clarify-ui-text-soft) transition hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-theme-tokens-colors-foreground) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)"><XIcon className="size-4" aria-hidden="true" /></button>
            <ApiRequestWorkbench {...workbenchProps} compact />
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
