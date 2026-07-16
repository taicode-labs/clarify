import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import clsx from 'clsx'
import { EraserIcon, RotateCcwIcon, XIcon } from 'lucide-react'
import { type ReactNode } from 'react'

import { useBuiltInText } from '../../core/i18n'
import { buildApiRequest, parameterKey } from '../lib/api-request'
import { getOperationParameters, isRecord, resolveSchema, stringifyExample } from '../lib/helpers'
import type { OpenAPIOperation, OpenAPIOperationSource, OpenAPISpec } from '../lib/utils'
import type { OpenApiParameter } from '../types'

import { EndpointMethodBadge } from './EndpointMethodBadge'
import { getServerKey } from './ExamplePanels'
import { InlineListbox } from './InlineListbox'
import { OpenApiAuthPanel } from './OpenApiAuthPanel'
import { RequestField, RequestSection } from './OpenApiRequestFields'
import { OpenApiResponseViewer } from './OpenApiResponseViewer'
import { SendRequestButton } from './SendRequestButton'
import { useOpenApiParameterState, useOpenApiRequestExecution, useOpenApiRequestTarget } from './useOpenApiRequestState'

type OpenApiRequestWorkbenchProps = {
  spec: OpenAPISpec
  path: string
  method: string
  operation: OpenAPIOperation
  operationSource?: OpenAPIOperationSource
  compact?: boolean
  onClose?: () => void
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

export function OpenApiRequestWorkbench(arg0: OpenApiRequestWorkbenchProps): ReactNode {
  const { spec, path, method, operation, operationSource = 'path', compact = false, onClose } = arg0
  const t = useBuiltInText()
  const parameters = getOperationParameters(spec, path, operation, operationSource)
  const requestTarget = useOpenApiRequestTarget(spec, path, operation, operationSource)
  const { servers, selectedServer, selectedServerKey, serverVariables, setServerVariables, serverVariableEntries, selectServer, authOptions, selectedAuthName, setSelectedAuthName, selectedAuth, credentialScope, credentials, setCredential, clearCredential, requestContents, mediaType, body, setBody, selectMediaType } = requestTarget
  const parameterState = useOpenApiParameterState(spec, parameters, (parameter) => initialParameterValue(spec, parameter))
  const { parameterValues, parameterEnabled, parameterIssues, setParameterGroupValues, setParameterIncluded, updateParameterValue } = parameterState
  const requestExecution = useOpenApiRequestExecution()
  const { exchange, error, sending, execute } = requestExecution
  const parameterGroups = ['cookie', 'header', 'query'].map((location) => ({
    location,
    parameters: parameters.filter((parameter) => parameter.in === location),
  })).filter((group) => group.parameters.length > 0)
  const pathParameters = parameters.filter((parameter) => parameter.in === 'path')
  const hasRequestConfiguration = authOptions.length > 0 || serverVariableEntries.length > 0 || parameters.length > 0 || requestContents.length > 0
  async function sendRequest() {
    const enabledParameters = parameters.filter((parameter) => parameterEnabled[parameterKey(parameter)] !== false)
    const issues = parameterState.validate(enabledParameters)
    if (Object.keys(issues).length > 0) return
    await execute(buildApiRequest({ method, path, server: selectedServer, serverVariables, parameters, parameterValues, parameterEnabled, auth: selectedAuth?.schemes.map((option) => ({ scheme: option.scheme, value: credentials[option.name] ?? '' })), mediaType, body, baseUrl: window.location.href }), t('openapi.requestCorsHint'))
  }

  function renderParameterField(parameter: OpenApiParameter) {
    const key = parameterKey(parameter)
    return (
      <RequestField
        key={key}
        spec={spec}
        parameter={parameter}
        value={parameterValues[key] ?? ''}
        enabled={parameterEnabled[key] !== false}
        issue={parameterIssues[key]}
        onEnabledChange={(enabled) => setParameterIncluded(parameter, enabled)}
        onChange={(value) => updateParameterValue(parameter, value)}
      />
    )
  }

  function renderParameterGroup(group: (typeof parameterGroups)[number]) {
    const { location, parameters: grouped } = group
    const actions = location === 'cookie' ? undefined : (
      <>
        <button type="button" title={t('openapi.resetToExample')} aria-label={t('openapi.resetToExample')} onClick={() => setParameterGroupValues(grouped, 'reset')} className="grid size-7 place-items-center rounded-(--clarify-theme-tokens-radius-md) text-(--clarify-ui-text-faint) hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-ui-text-strong) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)">
          <RotateCcwIcon className="size-3.5" aria-hidden="true" />
        </button>
        <button type="button" title={t('openapi.clear')} aria-label={t('openapi.clear')} onClick={() => setParameterGroupValues(grouped, 'clear')} className="grid size-7 place-items-center rounded-(--clarify-theme-tokens-radius-md) text-(--clarify-ui-text-faint) hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-ui-text-strong) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)">
          <EraserIcon className="size-3.5" aria-hidden="true" />
        </button>
      </>
    )

    return (
      <RequestSection key={location} title={parameterGroupLabel(location, t)} count={grouped.length} defaultOpen actions={actions}>
        {location === 'cookie'
          ? <p className="px-3 py-4 text-xs/5 text-(--clarify-ui-text-faint)">{t('openapi.cookieParametersBrowserManaged')}</p>
          : grouped.map(renderParameterField)}
      </RequestSection>
    )
  }

  function renderHeader() {
    return (
      <div className="flex min-w-0 items-center gap-1.5 border-b border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) px-2.5 py-2">
        <EndpointMethodBadge method={method.toUpperCase()} />
        {servers.length > 0 ? <InlineListbox
          label={t('openapi.server')}
          value={selectedServerKey}
          options={servers.map((server, index) => ({ value: getServerKey(server, index), label: server.url ?? `Server ${index + 1}`, description: server.description }))}
          onChange={selectServer}
          className="min-w-0 max-w-48 shrink sm:max-w-48"
          buttonClassName="flex h-8 min-w-0 max-w-full items-center gap-1 rounded-(--clarify-theme-tokens-radius-md) px-2 text-xs font-medium text-(--clarify-ui-text-strong) outline-hidden transition hover:bg-(--clarify-ui-hover-background) focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--clarify-theme-tokens-colors-primary)"
        /> : null}
        <span className="min-w-0 flex-1 overflow-x-auto border-l border-(--clarify-theme-tokens-colors-border) pl-2 font-mono text-xs text-(--clarify-theme-tokens-colors-foreground)">{path || '/'}</span>
        <SendRequestButton label={sending ? t('openapi.sendingRequest') : t('openapi.sendRequest')} busy={sending} text={t('openapi.sendRequest')} onClick={sendRequest} />
        {onClose ? <button type="button" onClick={onClose} aria-label={t('openapi.closeRequest')} title={t('openapi.closeRequest')} className="grid size-8 shrink-0 place-items-center rounded-(--clarify-theme-tokens-radius-md) text-(--clarify-ui-text-soft) transition hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-theme-tokens-colors-foreground) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)"><XIcon className="size-4" aria-hidden="true" /></button> : null}
      </div>
    )
  }

  function renderVariables() {
    if (serverVariableEntries.length === 0) return null
    return (
      <RequestSection title={t('openapi.variables')} count={serverVariableEntries.length} defaultOpen>
        {serverVariableEntries.map(([name, variable]) => (
          <label key={name} className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <span className="flex min-h-8 items-center border-r border-(--clarify-theme-tokens-colors-border) px-2 font-mono text-xs text-(--clarify-ui-text-strong)">{name}</span>
            <input value={serverVariables[name] ?? variable.default ?? ''} onChange={(event) => setServerVariables((current) => ({ ...current, [name]: event.target.value }))} className="h-8 min-w-0 border-0 bg-transparent px-2 font-mono text-xs text-(--clarify-theme-tokens-colors-foreground) outline-hidden focus:bg-(--clarify-ui-hover-background) focus:ring-0" />
          </label>
        ))}
      </RequestSection>
    )
  }

  function renderRequestBody() {
    if (requestContents.length === 0) return null
    return (
      <RequestSection title={t('openapi.requestBody')} count={1} defaultOpen className="open:grid open:min-h-55 open:grow open:shrink open:basis-55 open:grid-rows-[auto_minmax(11rem,1fr)]" contentClassName={clsx('grid h-full min-h-0', requestContents.length > 1 ? 'grid-rows-[auto_minmax(11rem,1fr)]' : 'grid-rows-[minmax(11rem,1fr)]')}>
        {requestContents.length > 1 ? <div><InlineListbox label={t('openapi.mediaType')} value={mediaType} options={requestContents.map((entry) => ({ value: entry.mediaType, label: entry.mediaType }))} onChange={selectMediaType} /></div> : null}
        <textarea aria-label={t('openapi.requestBody')} value={body} onChange={(event) => setBody(event.target.value)} spellCheck={false} className="block h-full min-h-44 w-full resize-none border-0 bg-(--clarify-code-background) p-3 font-mono text-xs/5 text-(--clarify-code-text) outline-hidden focus:ring-2 focus:ring-inset focus:ring-(--clarify-theme-tokens-colors-primary)" />
      </RequestSection>
    )
  }

  return (
    <div className={clsx('clarify-api-request flex min-h-0 min-w-0 flex-col not-prose bg-(--clarify-theme-tokens-colors-surface) [--clarify-theme-tokens-radius-lg:6px] [--clarify-theme-tokens-radius-md:4px] [--clarify-theme-tokens-radius-sm:2px] [--clarify-theme-tokens-radius-xl:8px] [--clarify-ui-accent-background:color-mix(in_srgb,var(--clarify-theme-tokens-colors-foreground)_10%,transparent)] [--clarify-ui-accent-border:color-mix(in_srgb,var(--clarify-theme-tokens-colors-foreground)_22%,transparent)] [--clarify-ui-accent-text:var(--clarify-theme-tokens-colors-foreground)] [--clarify-ui-active-background:color-mix(in_srgb,var(--clarify-theme-tokens-colors-foreground)_12%,transparent)] [--clarify-ui-subtle-background:color-mix(in_srgb,var(--clarify-theme-tokens-colors-foreground)_5%,transparent)]', compact ? 'h-full' : 'my-6')}>
      {renderHeader()}

      <div className="grid min-h-0 flex-1 gap-0 px-0 lg:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)]">
        <div className="flex min-h-0 min-w-0 flex-col overflow-y-auto">
          {authOptions.length > 0 ? <RequestSection title={t('openapi.authentication')} count={selectedAuth?.schemes.length ?? 0} defaultOpen>
            <OpenApiAuthPanel authOptions={authOptions} selectedAuthName={selectedAuthName} selectedAuth={selectedAuth} authValues={credentials} onSelectAuth={setSelectedAuthName} onChangeAuthValue={(name, value) => setCredential(credentialScope, name, value)} onClearAuthValue={(name) => clearCredential(credentialScope, name)} />
          </RequestSection> : null}

          {renderVariables()}

          {pathParameters.length > 0 ? <RequestSection title={t('openapi.pathParameters')} count={pathParameters.length} defaultOpen>
            {pathParameters.map(renderParameterField)}
          </RequestSection> : null}

          {parameterGroups.map(renderParameterGroup)}

          {renderRequestBody()}

          {!hasRequestConfiguration ? <RequestSection title={t('openapi.requestConfiguration')} count={0} defaultOpen>
            <p className="px-3 py-5 text-xs/5 text-(--clarify-ui-text-faint)">{t('openapi.noRequestConfiguration')}</p>
          </RequestSection> : null}

        </div>

        <div className="h-full min-h-0 min-w-0 overflow-hidden border-t border-(--clarify-theme-tokens-colors-border) lg:border-t-0 lg:border-l">
          <OpenApiResponseViewer exchange={exchange} error={error} />
        </div>
      </div>
    </div>
  )
}

export function OpenApiRequestDialog(arg0: OpenApiRequestDialogProps): ReactNode {
  const { open, onClose, ...workbenchProps } = arg0
  const t = useBuiltInText()

  return (
    <Dialog open={open} onClose={() => {}} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-(--clarify-ui-overlay-background) backdrop-blur-sm" />
      <div className="fixed inset-0 grid place-items-center overflow-y-auto p-3 sm:p-6">
          <DialogPanel className="relative flex h-[min(46rem,calc(100dvh-1.5rem))] w-full max-w-7xl flex-col overflow-hidden rounded-lg border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-background) shadow-2xl sm:h-[min(46rem,calc(100dvh-3rem))]">
            <DialogTitle className="sr-only">{t('openapi.tryRequest')}</DialogTitle>
            <OpenApiRequestWorkbench {...workbenchProps} compact onClose={onClose} />
          </DialogPanel>
      </div>
    </Dialog>
  )
}
