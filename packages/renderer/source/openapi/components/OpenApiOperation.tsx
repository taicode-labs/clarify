import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import clsx from 'clsx'
import { slug } from 'github-slugger'
import { CheckIcon, ChevronDownIcon, LockKeyholeIcon, ServerIcon, UnlockKeyholeIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Heading } from '../../components/Heading'
import { getMediaTypeEntries, getResponseEntries } from '../lib/helpers'
import type { OpenAPIOperation, OpenAPISpec } from '../lib/utils'
import type { OpenApiServer, OpenApiServerVariable } from '../types'

import { EndpointRequest, EndpointResponse } from './EndpointSections'
import { authLabel, authPlaceholder, getServerKey, getServerLabel } from './ExamplePanels'
import type { AuthOption } from './ExamplePanels'
import { useOperationAuthState, useOperationRequestState, useOperationServerState } from './OpenApiOperation.state'


export type OpenApiOperationProps = {
  spec: OpenAPISpec
  path: string
  method: string
  operation: OpenAPIOperation
}

const endpointMethodStyleVars: Record<string, string> = {
  GET: 'bg-(--clarify-http-method-get-background) text-(--clarify-http-method-get-text)',
  POST: 'bg-(--clarify-http-method-post-background) text-(--clarify-http-method-post-text)',
  PUT: 'bg-(--clarify-http-method-put-background) text-(--clarify-http-method-put-text)',
  PATCH: 'bg-(--clarify-http-method-patch-background) text-(--clarify-http-method-patch-text)',
  DELETE: 'bg-(--clarify-http-method-delete-background) text-(--clarify-http-method-delete-text)',
}

type EndpointMethodBadgeProps = { method: string }

function EndpointMethodBadge(arg0: EndpointMethodBadgeProps): ReactNode {
  const { method } = arg0

  return (
    <span
      className={clsx(
        'rounded-(--clarify-theme-tokens-radius-md) px-2.5 py-0.5 text-xs/6 font-black tracking-wide',
        endpointMethodStyleVars[method] ?? 'bg-(--clarify-http-method-default-background) text-(--clarify-http-method-default-text)',
      )}
    >
      {method}
    </span>
  )
}

type EndpointPathProps = { path: string }

function EndpointPath(arg0: EndpointPathProps): ReactNode {
  const { path } = arg0

  const segments = path.split('/').filter(Boolean)

  return (
    <div className="flex min-w-0 flex-1 items-center overflow-x-auto text-sm font-bold leading-6 whitespace-nowrap">
      {segments.length > 0 ? (
        <>
          <span className="text-(--clarify-ui-text-faint)">/</span>
          {segments.map((segment, index) => (
            <span key={`${segment}-${index}`} className="flex items-center">
              {index > 0 ? <span className="text-(--clarify-ui-text-faint)">/</span> : null}
              <span className="font-bold text-(--clarify-theme-tokens-colors-foreground)">{segment}</span>
            </span>
          ))}
        </>
      ) : (
        <span className="font-bold text-(--clarify-theme-tokens-colors-foreground)">/</span>
      )}
    </div>
  )
}

type UiOption = {
  value: string
  label: string
  description?: string
}

type InlineListboxProps = {
  label: string
  value: string
  options: UiOption[]
  onChange: (value: string) => void
  compact?: boolean
}

function InlineListbox(arg0: InlineListboxProps): ReactNode {
  const { label, value, options, onChange, compact = false } = arg0

  const selected = options.find((option) => option.value === value) ?? options[0]

  return (
    <Listbox value={selected?.value ?? value} onChange={onChange}>
      <div className="pointer-events-auto relative inline-flex min-w-0">
        <ListboxButton
          aria-label={label}
          className={clsx(
            'inline-flex min-w-0 items-center gap-1 rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) font-semibold text-(--clarify-theme-tokens-colors-foreground) shadow-xs outline-hidden transition hover:border-(--clarify-ui-text-faint) hover:bg-(--clarify-ui-hover-background) data-open:border-(--clarify-ui-text-faint) data-open:bg-(--clarify-ui-hover-background)',
            compact ? 'max-w-32 px-1.5 py-0.5 text-xs' : 'w-full px-2.5 py-1.5 text-xs',
          )}
        >
          <span className="truncate">{selected?.label ?? value}</span>
          <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-(--clarify-ui-text-faint)" aria-hidden="true" />
        </ListboxButton>
        <ListboxOptions anchor="bottom start" className="z-30 mt-1 max-h-64 w-max min-w-(--button-width) max-w-(--clarify-popover-max-width) overflow-auto rounded-xl bg-(--clarify-theme-tokens-colors-surface) p-1 text-xs shadow-lg shadow-black/10 ring-1 ring-(--clarify-theme-tokens-colors-border) [--anchor-gap:--spacing(1)] focus:outline-none">
          {options.map((option) => (
            <ListboxOption key={option.value} value={option.value} className="group flex cursor-default items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-xs text-(--clarify-ui-text) select-none data-focus:bg-(--clarify-ui-hover-background) data-selected:text-(--clarify-theme-tokens-colors-primary)">
              <span className="min-w-0">
                <span className="block truncate">{option.label}</span>
                {option.description ? <span className="mt-0.5 block truncate text-2xs text-(--clarify-ui-text-faint)">{option.description}</span> : null}
              </span>
              <CheckIcon className="h-3.5 w-3.5 shrink-0 opacity-0 group-data-selected:opacity-100" aria-hidden="true" />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  )
}

function getServerPreviewUrl(server: OpenApiServer, variables: Record<string, string>): string {
  return (server.url ?? '').replace(/\{([^}]+)\}/g, (_, name: string) => variables[name] ?? server.variables?.[name]?.default ?? `{${name}}`)
}

function getDefaultResponseStatus(operation: OpenAPIOperation, spec?: OpenAPISpec): string {
  const responses = getResponseEntries(operation, spec).filter(({ response }) => getMediaTypeEntries(response.content, spec).length > 0)
  const orderedResponses = [...responses].sort((left, right) => {
    if (left.status === 'default') return -1
    if (right.status === 'default') return 1

    const leftCode = Number(left.status)
    const rightCode = Number(right.status)

    if (!Number.isNaN(leftCode) && !Number.isNaN(rightCode)) return leftCode - rightCode
    return left.status.localeCompare(right.status)
  })

  return orderedResponses.find(({ status }) => status === 'default')?.status
    ?? orderedResponses.find(({ status }) => status.startsWith('2'))?.status
    ?? orderedResponses[0]?.status
    ?? ''
}

type ServerUrlValueProps = {
  server: OpenApiServer
  variables: Record<string, string>
  open: boolean
  interactive: boolean
  onToggle: () => void
}

function ServerUrlValue(arg0: ServerUrlValueProps): ReactNode {
  const { server, variables, open, interactive, onToggle } = arg0

  const url = getServerPreviewUrl(server, variables)

  if (!interactive) {
    return (
      <span
        aria-label="Server"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--clarify-ui-subtle-background) text-(--clarify-ui-text-foreground) sm:w-auto sm:min-w-16 sm:max-w-(--clarify-server-url-max-width) sm:px-1.5"
      >
        <span className="sm:hidden"><ServerIcon className="h-4 w-4" aria-hidden="true" /></span>
        <span className="hidden min-w-0 items-center overflow-hidden sm:flex">
          <span className="truncate font-semibold text-xs">{url}</span>
        </span>
      </span>
    )
  }

  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label="Server"
      onClick={onToggle}
      className={clsx(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--clarify-ui-subtle-background) text-(--clarify-ui-text-foreground) transition hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-theme-tokens-colors-foreground) sm:w-auto sm:min-w-16 sm:max-w-(--clarify-server-url-max-width) sm:px-1.5',
        open ? 'bg-(--clarify-ui-active-background) text-(--clarify-theme-tokens-colors-foreground)' : null,
      )}
    >
      <span className="sm:hidden"><ServerIcon className="h-4 w-4" aria-hidden="true" /></span>
      <span className="hidden min-w-0 items-center gap-1 overflow-hidden sm:flex">
        <span className="truncate font-semibold text-xs">{url}</span>
        <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
      </span>
    </button>
  )
}

type ServerVariableControlProps = {
  name: string
  variable?: OpenApiServerVariable
  value: string
  onChange: (value: string) => void
  compact?: boolean
}

function ServerVariableControl(arg0: ServerVariableControlProps): ReactNode {
  const { name, variable, value, onChange, compact = false } = arg0

  if (variable?.enum?.length) {
    return (
      <InlineListbox
        label={name}
        value={value}
        options={variable.enum.map((option) => ({ value: option, label: option }))}
        onChange={onChange}
        compact={compact}
      />
    )
  }

  return (
    <input
      aria-label={name}
      value={value}
      placeholder={variable?.default ?? name}
      onChange={(event) => onChange(event.target.value)}
      className={clsx(
        'pointer-events-auto rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) text-xs font-semibold text-(--clarify-theme-tokens-colors-foreground) shadow-xs outline-hidden transition placeholder:text-(--clarify-ui-text-faint) hover:border-(--clarify-ui-text-faint) hover:bg-(--clarify-ui-hover-background) focus:border-(--clarify-theme-tokens-colors-primary) focus:bg-(--clarify-theme-tokens-colors-surface)',
        compact ? 'mx-0.5 w-24 px-1.5 py-0.5' : 'w-full px-2.5 py-1.5',
      )}
    />
  )
}

type ServerPanelProps = {
  servers: OpenApiServer[]
  selectedKey: string
  selectedServer: OpenApiServer
  variables: Record<string, string>
  onSelectServer: (key: string) => void
  onChangeVariable: (name: string, value: string) => void
}

function ServerPanel(arg0: ServerPanelProps): ReactNode {
  const { servers, selectedKey, selectedServer, variables, onSelectServer, onChangeVariable } = arg0

  const variableEntries = Object.entries(selectedServer.variables ?? {})

  return (
    <div className="border-t border-(--clarify-theme-tokens-colors-border) bg-(--clarify-ui-subtle-background) p-3">
      <div className="flex flex-col gap-3">
        {servers.length > 1 ? (
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className="text-2xs font-semibold text-(--clarify-ui-text-soft)">Server</span>
            <InlineListbox
              label="Server"
              value={selectedKey}
              options={servers.map((server, index) => ({
                value: getServerKey(server, index),
                label: getServerLabel(server, index),
                description: server.description,
              }))}
              onChange={onSelectServer}
            />
          </label>
        ) : null}
        {variableEntries.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-(--clarify-openapi-variable-grid)">
            {variableEntries.map(([name, variable]) => (
              <label key={name} className="flex min-w-0 flex-col gap-1.5">
                <span className="text-2xs font-semibold text-(--clarify-ui-text-soft)">{name}</span>
                <ServerVariableControl
                  name={name}
                  variable={variable}
                  value={variables[name] ?? variable.default ?? ''}
                  onChange={(value) => onChangeVariable(name, value)}
                />
              </label>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

type AuthPanelProps = {
  authOptions: AuthOption[]
  selectedAuthName: string
  selectedAuth?: AuthOption
  authValues: Record<string, string>
  onSelectAuth: (name: string) => void
  onChangeAuthValue: (name: string, value: string) => void
}

function AuthPanel(arg0: AuthPanelProps): ReactNode {
  const { authOptions, selectedAuthName, selectedAuth, authValues, onSelectAuth, onChangeAuthValue } = arg0

  if (authOptions.length === 0) return null

  return (
    <div className="border-t border-(--clarify-theme-tokens-colors-border) bg-(--clarify-ui-subtle-background) p-3">
      <div className="grid gap-3 sm:grid-cols-(--clarify-openapi-control-grid)">
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-2xs font-semibold text-(--clarify-ui-text-soft)">Auth</span>
          <InlineListbox
            label="Auth"
            value={selectedAuthName}
            options={authOptions.map(({ name, scheme }) => ({
              value: name,
              label: name,
              description: authLabel(name, scheme),
            }))}
            onChange={onSelectAuth}
          />
        </label>
        {selectedAuth ? (
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className="text-2xs font-semibold text-(--clarify-ui-text-soft)">Credential</span>
            <div className="flex min-w-0 items-center rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) px-2.5 py-1.5 shadow-xs">
              <span className="mr-2 shrink-0 text-2xs font-semibold text-(--clarify-ui-text-soft)">
                {selectedAuth.scheme.type === 'apiKey' ? selectedAuth.scheme.in ?? 'apiKey' : selectedAuth.scheme.scheme ?? selectedAuth.scheme.type ?? 'token'}
              </span>
              <input
                value={authValues[selectedAuth.name] ?? authPlaceholder(selectedAuth)}
                onChange={(event) => onChangeAuthValue(selectedAuth.name, event.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-xs font-semibold text-(--clarify-theme-tokens-colors-foreground) outline-hidden placeholder:text-(--clarify-ui-text-faint)"
              />
            </div>
          </label>
        ) : null}
      </div>
    </div>
  )
}

type EndpointIdentityProps = {
  method: string
  path: string
  servers: OpenApiServer[]
  selectedServerKey: string
  selectedServer: OpenApiServer
  serverVariables: Record<string, string>
  serverOpen: boolean
  authOptions: AuthOption[]
  selectedAuthName: string
  selectedAuth?: AuthOption
  authValues: Record<string, string>
  authOpen: boolean
  onSelectServer: (key: string) => void
  onChangeServerVariable: (name: string, value: string) => void
  onToggleServer: () => void
  onToggleAuth: () => void
  onSelectAuth: (name: string) => void
  onChangeAuthValue: (name: string, value: string) => void
}

export function EndpointIdentity(arg0: EndpointIdentityProps): ReactNode {
  const {
    method,
    path,
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
    onSelectServer,
    onChangeServerVariable,
    onToggleServer,
    onToggleAuth,
    onSelectAuth,
    onChangeAuthValue,
  } = arg0

  const serverInteractive = servers.length > 1 || Object.keys(selectedServer.variables ?? {}).length > 0

  return (
    <div className="not-prose flex w-full flex-col overflow-hidden rounded-xl border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) shadow-xs">
      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden px-2.5 py-2">
        <EndpointMethodBadge method={method} />
        <ServerUrlValue
          server={selectedServer}
          variables={serverVariables}
          open={serverOpen}
          interactive={serverInteractive}
          onToggle={onToggleServer}
        />
        <EndpointPath path={path} />
        {authOptions.length > 0 ? (
          <button
            type="button"
            aria-expanded={authOpen}
            aria-label="Auth"
            onClick={onToggleAuth}
            className={clsx(
              'ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-(--clarify-ui-text-soft) transition hover:bg-(--clarify-ui-hover-background) hover:text-emerald-700 dark:hover:text-emerald-200',
              authOpen ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-100' : 'bg-(--clarify-ui-subtle-background)',
            )}
          >
            {authOpen ? <UnlockKeyholeIcon className="h-4 w-4" aria-hidden="true" /> : <LockKeyholeIcon className="h-4 w-4" aria-hidden="true" />}
          </button>
        ) : null}
      </div>
      {serverInteractive && serverOpen ? (
        <ServerPanel
          servers={servers}
          selectedKey={selectedServerKey}
          selectedServer={selectedServer}
          variables={serverVariables}
          onSelectServer={onSelectServer}
          onChangeVariable={onChangeServerVariable}
        />
      ) : null}
      {authOpen ? (
        <AuthPanel
          authOptions={authOptions}
          selectedAuthName={selectedAuthName}
          selectedAuth={selectedAuth}
          authValues={authValues}
          onSelectAuth={onSelectAuth}
          onChangeAuthValue={onChangeAuthValue}
        />
      ) : null}
    </div>
  )
}

export function OpenApiOperation(arg0: OpenApiOperationProps): ReactNode {
  const { spec, path, method, operation } = arg0

  const id = slug(`${method.toLowerCase()} ${path}`)
  const summary = operation.summary ?? `${method} ${path}`
  const description = operation.description
  const requestState = useOperationRequestState(spec, path, operation)
  const serverState = useOperationServerState(spec, operation, path)
  const authState = useOperationAuthState(spec, operation)
  const [linkedExampleKey, setLinkedExampleKey] = useState('')
  const [selectedResponseStatus, setSelectedResponseStatus] = useState(() => getDefaultResponseStatus(operation, spec))

  return (
    <section className="clarify-api-endpoint scroll-mt-24 pb-16 first:pt-0 last:pb-0" aria-labelledby={id}>
      <Heading id={id}>
        {summary}
      </Heading>
      <EndpointIdentity
        method={method}
        path={path}
        servers={serverState.servers}
        selectedServerKey={serverState.selectedServerKey}
        selectedServer={serverState.selectedServer}
        serverVariables={serverState.serverVariables}
        serverOpen={serverState.serverOpen}
        authOptions={authState.authOptions}
        selectedAuthName={authState.selectedAuthName}
        selectedAuth={authState.selectedAuth}
        authValues={authState.authValues}
        authOpen={authState.authOpen}
        onSelectServer={serverState.onSelectServer}
        onChangeServerVariable={serverState.onChangeServerVariable}
        onToggleServer={() => {
          serverState.onToggleServer()
          authState.closeAuth()
        }}
        onToggleAuth={() => {
          authState.onToggleAuth()
          serverState.closeServer()
        }}
        onSelectAuth={authState.onSelectAuth}
        onChangeAuthValue={authState.onChangeAuthValue}
      />
      <EndpointRequest
        spec={spec}
        path={path}
        method={method}
        description={description}
        groupedParameters={requestState.groupedParameters}
        parameters={requestState.parameters}
        requestBody={requestState.requestBody}
        requestContents={requestState.requestContents}
        requestSchema={requestState.requestSchema}
        selectedRequestMediaType={requestState.selectedRequestMediaType}
        onSelectRequestMediaType={requestState.setSelectedRequestMediaType}
        selectedServer={serverState.selectedServer}
        serverVariables={serverState.serverVariables}
        auth={authState.authInput}
        sharedExampleKey={linkedExampleKey}
        onSelectExampleKey={setLinkedExampleKey}
      />
      <EndpointResponse
        spec={spec}
        operation={operation}
        sharedExampleKey={linkedExampleKey}
        onSelectExampleKey={setLinkedExampleKey}
        selectedStatus={selectedResponseStatus}
        onSelectStatus={setSelectedResponseStatus}
      />
    </section>
  )
}
