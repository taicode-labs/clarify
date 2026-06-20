import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { CheckIcon, ChevronsUpDownIcon, ClipboardIcon, CodeIcon, PackageIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { useBuiltInText } from '../i18n'
import { copyTextToClipboard } from '../utils/clipboard'

import { codeLanguageForMediaType, getExampleEntries, getMediaTypeEntries, getPathItem, getResponseEntries, isRecord, stringifyExample } from './helpers'
import { buildRequestCodeExamples } from './request-code'
import type {
  ExampleEntry,
  MediaTypeEntry,
  OpenApiParameter,
  OpenApiSecurityRequirement,
  OpenApiSecurityScheme,
  OpenApiServer,
  RequestAuthInput,
  RequestCodeExample,
} from './types'
import type { OpenAPIOperation, OpenAPISpec } from './utils'

type SelectOption = {
  value: string
  label: string
}

function SelectControl(arg0: {
  label: string
  value: string
  options: Array<string | SelectOption>
  onChange: (value: string) => void
  icon?: ReactNode
  compact?: boolean
}): ReactNode {
  const {
    label,
    value,
    options,
    onChange,
    icon,
    compact = false,
  } = arg0

  const normalizedOptions = options.map((option) => (typeof option === 'string' ? { value: option, label: option } : option))
  const selectedOption = normalizedOptions.find((option) => option.value === value) ?? normalizedOptions[0]
  const wrapperClassName = compact ? 'clarify-api-select relative min-w-0 text-xs' : 'clarify-api-select relative shrink-0 text-xs'
  const buttonSizeClassName = compact ? 'w-full min-w-0 max-w-32' : 'min-w-28 max-w-48'

  if (normalizedOptions.length <= 1) return null

  return (
    <Listbox value={value} onChange={onChange}>
      <div className={wrapperClassName}>
        <ListboxButton
          aria-label={label}
          className={`clarify-api-select-button flex ${buttonSizeClassName} items-center justify-between gap-2 rounded-lg bg-black/30 px-2 py-1 font-mono text-xs font-medium whitespace-nowrap text-zinc-100 outline-hidden transition hover:bg-black/50 focus:ring-2 focus:ring-emerald-400/25 data-open:bg-white/10 data-open:ring-2 data-open:ring-emerald-400/25`}
        >
          <span className="flex min-w-0 items-center gap-1.5 overflow-hidden">
            {icon ? <span className="shrink-0 text-zinc-500">{icon}</span> : null}
            <span className="truncate">{selectedOption?.label ?? value}</span>
          </span>
          <ChevronsUpDownIcon className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
        </ListboxButton>
        <ListboxOptions
          anchor="bottom end"
          className="clarify-api-select-options z-30 mt-1 max-h-64 w-max min-w-(--button-width) max-w-[min(32rem,calc(100vw-2rem))] overflow-auto rounded-xl bg-zinc-900 p-1 text-xs shadow-lg shadow-black/20 ring-1 ring-white/10 [--anchor-gap:--spacing(1)] focus:outline-none"
        >
          {normalizedOptions.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              className="clarify-api-select-option group flex cursor-default items-center justify-between gap-3 rounded-lg px-2.5 py-2 font-mono text-xs whitespace-nowrap text-zinc-300 select-none data-focus:bg-white/10 data-focus:text-white data-selected:text-emerald-300"
            >
              <span>{option.label}</span>
              <CheckIcon className="h-3.5 w-3.5 shrink-0 opacity-0 group-data-selected:opacity-100" aria-hidden="true" />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  )
}

function getExampleLabel(example: ExampleEntry, t: ReturnType<typeof useBuiltInText>): string {
  return example.generated && example.title === 'schema' ? t('openapi.schemaExample') : example.title
}

function getLanguageOptions(codeOptions?: RequestCodeExample[]): SelectOption[] {
  const languages = new Map<string, string>()
  for (const option of codeOptions ?? []) languages.set(option.languageKey, option.title)
  return Array.from(languages, ([value, label]) => ({ value, label }))
}

function getClientOptions(codeOptions: RequestCodeExample[] | undefined, languageKey?: string): SelectOption[] {
  return (codeOptions ?? [])
    .filter((option) => option.languageKey === languageKey)
    .map((option) => ({ value: option.clientKey, label: option.clientTitle }))
}

export function getServers(spec: OpenAPISpec, operation: OpenAPIOperation, path?: string): OpenApiServer[] {
  const operationServers = (operation as Record<string, unknown>).servers
  const pathServers = path ? getPathItem(spec, path)?.servers : undefined
  const servers = Array.isArray(operationServers)
    ? operationServers
    : Array.isArray(pathServers)
      ? pathServers
      : (spec as Record<string, unknown>).servers
  if (!Array.isArray(servers)) return [{ url: 'https://api.example.com' }]
  const validServers = servers.filter((server): server is OpenApiServer => isRecord(server) && typeof server.url === 'string')
  return validServers.length > 0 ? validServers : [{ url: 'https://api.example.com' }]
}

export function getServerKey(server: OpenApiServer, index: number): string {
  return `${index}:${server.url ?? ''}`
}

export function getServerLabel(server: OpenApiServer, index: number): string {
  return server.description ? `${server.description} (${server.url})` : server.url ?? `Server ${index + 1}`
}

export function defaultServerVariables(server?: OpenApiServer): Record<string, string> {
  return Object.fromEntries(
    Object.entries(server?.variables ?? {}).map(([name, variable]) => [name, variable.default ?? variable.enum?.[0] ?? '']),
  )
}

function getSecuritySchemes(spec: OpenAPISpec): Record<string, OpenApiSecurityScheme> {
  const schemes = (spec as Record<string, unknown>).components
  if (!isRecord(schemes) || !isRecord(schemes.securitySchemes)) return {}

  return Object.fromEntries(
    Object.entries(schemes.securitySchemes).filter((entry): entry is [string, OpenApiSecurityScheme] => isRecord(entry[1])),
  )
}

function getSecurityRequirements(spec: OpenAPISpec, operation: OpenAPIOperation): OpenApiSecurityRequirement[] {
  const operationSecurity = (operation as Record<string, unknown>).security
  if (Array.isArray(operationSecurity)) return operationSecurity.filter(isRecord) as OpenApiSecurityRequirement[]

  const specSecurity = (spec as Record<string, unknown>).security
  return Array.isArray(specSecurity) ? specSecurity.filter(isRecord) as OpenApiSecurityRequirement[] : []
}

export type AuthOption = { name: string; scheme: OpenApiSecurityScheme }

export function getAuthOptions(spec: OpenAPISpec, operation: OpenAPIOperation): AuthOption[] {
  const schemes = getSecuritySchemes(spec)
  const requirements = getSecurityRequirements(spec, operation)
  const names = new Set(requirements.flatMap((requirement) => Object.keys(requirement)))

  return Array.from(names)
    .map((name) => ({ name, scheme: schemes[name] }))
    .filter((option): option is AuthOption => Boolean(option.scheme))
}

export function authPlaceholder(auth?: { scheme: OpenApiSecurityScheme }): string {
  if (!auth) return ''
  if (auth.scheme.type === 'apiKey') return '{api_key}'
  if (auth.scheme.type === 'http' && auth.scheme.scheme?.toLowerCase() === 'basic') return '{base64_credentials}'
  return '{token}'
}

export function authLabel(name: string, scheme: OpenApiSecurityScheme): string {
  const location = scheme.type === 'apiKey' && scheme.in && scheme.name ? ` · ${scheme.in}: ${scheme.name}` : ''
  return `${name}${location}`
}

function CopyCodeButton(arg0: { code: string }): ReactNode {
  const { code } = arg0

  const t = useBuiltInText()
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      onClick={() => {
        void copyTextToClipboard(code).then((ok) => {
          if (!ok) return
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1000)
        })
      }}
      className="flex items-center gap-1.5 rounded-full bg-black/ px-2.5 py-1.5 text-2xs font-medium text-zinc-400 transition hover:bg-black/50 hover:text-zinc-200 focus:bg-black/50 focus:text-zinc-200"
    >
      {copied ? (
        <CheckIcon className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
      ) : (
        <ClipboardIcon className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
      )}
      <span>{copied ? t('actions.copied') : t('actions.copy')}</span>
    </button>
  )
}

function ExampleMetaValue(arg0: {
  label: string
  value: string
  options?: string[]
  onChange?: (value: string) => void
  className: string
}): ReactNode {
  const { label, value, options, onChange, className } = arg0

  if (options && options.length > 1 && onChange) {
    return <SelectControl label={label} value={value} options={options} onChange={onChange} />
  }

  return <span className={className}>{value}</span>
}

function CodeToolbar(arg0: {
  code: string
  languageOptions?: SelectOption[]
  selectedLanguageKey?: string
  onSelectLanguage?: (key: string) => void
  clientOptions?: SelectOption[]
  selectedClientKey?: string
  onSelectClient?: (key: string) => void
}): ReactNode {
  const {
    code,
    languageOptions,
    selectedLanguageKey,
    onSelectLanguage,
    clientOptions,
    selectedClientKey,
    onSelectClient,
  } = arg0

  const t = useBuiltInText()

  return (
    <div className="absolute top-3.5 right-4 left-4 z-10 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {languageOptions && languageOptions.length > 1 && selectedLanguageKey && onSelectLanguage ? (
          <SelectControl
            label={t('openapi.language')}
            value={selectedLanguageKey}
            options={languageOptions}
            onChange={onSelectLanguage}
            icon={<CodeIcon className="h-3.5 w-3.5" aria-hidden="true" />}
          />
        ) : null}
        {clientOptions && clientOptions.length > 1 && selectedClientKey && onSelectClient ? (
          <SelectControl
            label={t('openapi.client')}
            value={selectedClientKey}
            options={clientOptions}
            onChange={onSelectClient}
            icon={<PackageIcon className="h-3.5 w-3.5" aria-hidden="true" />}
          />
        ) : null}
      </div>
      <CopyCodeButton code={code} />
    </div>
  )
}

function ApiExampleCodeGroup(arg0: {
  title: string
  tag?: string
  tagOptions?: string[]
  onSelectTag?: (key: string) => void
  label?: string
  labelOptions?: string[]
  onSelectLabel?: (key: string) => void
  comfortableMeta?: boolean
  code: string
  language: string
  mediaTypes?: string[]
  selectedMediaType?: string
  onSelectMediaType?: (key: string) => void
  examples?: ExampleEntry[]
  selectedExampleKey?: string
  onSelectExample?: (key: string) => void
  languageOptions?: SelectOption[]
  selectedLanguageKey?: string
  onSelectLanguage?: (key: string) => void
  clientOptions?: SelectOption[]
  selectedClientKey?: string
  onSelectClient?: (key: string) => void
}): ReactNode {
  const {
    title,
    tag,
    tagOptions,
    onSelectTag,
    label,
    labelOptions,
    onSelectLabel,
    comfortableMeta = false,
    code,
    language,
    mediaTypes,
    selectedMediaType,
    onSelectMediaType,
    examples,
    selectedExampleKey,
    onSelectExample,
    languageOptions,
    selectedLanguageKey,
    onSelectLanguage,
    clientOptions,
    selectedClientKey,
    onSelectClient,
  } = arg0

  const t = useBuiltInText()
  const metaClassName = comfortableMeta
    ? 'flex min-h-11 min-w-0 items-center gap-2 border-y border-t-transparent border-b-white/7.5 bg-zinc-900 px-4 py-2 dark:border-b-white/5 dark:bg-white/1'
    : 'flex h-9 min-w-0 items-center gap-2 border-y border-t-transparent border-b-white/7.5 bg-zinc-900 px-4 dark:border-b-white/5 dark:bg-white/1'

  return (
    <div className="clarify-api-example my-6 overflow-hidden rounded-2xl bg-zinc-900 shadow-md dark:ring-1 dark:ring-white/10">
      <div className="not-prose">
        <div className="clarify-api-example-header flex min-h-[calc(--spacing(12)+1px)] items-center gap-3 border-b border-zinc-700 bg-zinc-800 px-4 py-2 dark:border-zinc-800 dark:bg-transparent">
          <h3 className="mr-auto min-w-16 truncate py-1 text-xs font-semibold text-white">{title}</h3>
          <div className="ml-auto flex min-w-0 items-center gap-2 whitespace-nowrap">
            {mediaTypes && mediaTypes.length > 1 && selectedMediaType && onSelectMediaType ? (
              <SelectControl
                label={t('openapi.mediaType')}
                value={selectedMediaType}
                options={mediaTypes}
                onChange={onSelectMediaType}
                compact
              />
            ) : null}
            {examples && examples.length > 1 && selectedExampleKey && onSelectExample ? (
              <SelectControl
                label={t('openapi.example')}
                value={selectedExampleKey}
                options={examples.map((example) => ({ value: example.key, label: getExampleLabel(example, t) }))}
                onChange={onSelectExample}
                compact
              />
            ) : null}
          </div>
        </div>
        {tag || label ? (
          <div className={metaClassName}>
            {tag ? (
              <ExampleMetaValue
                label={t('openapi.status')}
                value={tag}
                options={tagOptions}
                onChange={onSelectTag}
                className="font-mono text-[0.625rem]/6 font-semibold text-emerald-400"
              />
            ) : null}
            {tag && label ? <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-zinc-500" /> : null}
            {label ? (
              <ExampleMetaValue
                label={t('openapi.mediaType')}
                value={label}
                options={labelOptions}
                onChange={onSelectLabel}
                className="min-w-0 truncate font-mono text-xs text-zinc-400"
              />
            ) : null}
          </div>
        ) : null}
        <div className="clarify-api-example-code group relative">
          <CodeToolbar
            code={code}
            languageOptions={languageOptions}
            selectedLanguageKey={selectedLanguageKey}
            onSelectLanguage={onSelectLanguage}
            clientOptions={clientOptions}
            selectedClientKey={selectedClientKey}
            onSelectClient={onSelectClient}
          />
          <pre className={`overflow-x-auto p-4 text-xs text-white ${languageOptions && languageOptions.length > 1 ? 'pt-14' : ''}`}>
            <code className={`language-${language}`}>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}

export function RequestExamplesPanel(arg0: {
  spec: OpenAPISpec
  path: string
  method: string
  parameters: OpenApiParameter[]
  requestContents: MediaTypeEntry[]
  selectedMediaType: string
  onSelectMediaType: (value: string) => void
  selectedServer: OpenApiServer
  serverVariables: Record<string, string>
  auth?: RequestAuthInput
}): ReactNode {
  const {
    spec,
    path,
    method,
    parameters,
    requestContents,
    selectedMediaType,
    onSelectMediaType,
    selectedServer,
    serverVariables,
    auth,
  } = arg0

  const t = useBuiltInText()
  const selectedContent = requestContents.find((content) => content.mediaType === selectedMediaType) ?? requestContents[0]
  const examples = getExampleEntries(selectedContent?.value)
  const [selectedExampleKey, setSelectedExampleKey] = useState(examples[0]?.key ?? '')
  const [selectedLanguageKey, setSelectedLanguageKey] = useState('shell')
  const [selectedClientKey, setSelectedClientKey] = useState('curl')
  const selectedExample = examples.find((example) => example.key === selectedExampleKey) ?? examples[0]
  const requestContent = selectedContent ? { ...selectedContent, value: { ...selectedContent.value, example: selectedExample?.value, examples: undefined } } : undefined
  const codeOptions = buildRequestCodeExamples({
    spec,
    path,
    method,
    parameters,
    requestContent,
    server: selectedServer,
    serverVariables,
    auth,
  })
  const selectedLanguage = codeOptions.find((option) => option.languageKey === selectedLanguageKey) ?? codeOptions[0]
  const selectedCode =
    codeOptions.find((option) => option.languageKey === selectedLanguage.languageKey && option.clientKey === selectedClientKey) ??
    selectedLanguage
  const languageOptions = getLanguageOptions(codeOptions)
  const clientOptions = getClientOptions(codeOptions, selectedCode.languageKey)

  return (
    <ApiExampleCodeGroup
      title={t('openapi.request')}
      tag={method}
      label={path}
      code={selectedCode.code}
        language={selectedCode.language}
        mediaTypes={requestContents.map((content) => content.mediaType)}
        selectedMediaType={selectedContent?.mediaType}
        onSelectMediaType={(value) => {
          onSelectMediaType(value)
          setSelectedExampleKey(getExampleEntries(requestContents.find((content) => content.mediaType === value)?.value)[0]?.key ?? '')
        }}
        examples={examples}
        selectedExampleKey={selectedExample?.key}
        onSelectExample={setSelectedExampleKey}
        languageOptions={languageOptions}
        selectedLanguageKey={selectedCode.languageKey}
        onSelectLanguage={(value) => {
          const nextCode = codeOptions.find((option) => option.languageKey === value)
          setSelectedLanguageKey(nextCode?.languageKey ?? value)
          setSelectedClientKey(nextCode?.clientKey ?? '')
        }}
      clientOptions={clientOptions}
      selectedClientKey={selectedCode.clientKey}
      onSelectClient={setSelectedClientKey}
    />
  )
}

export function ResponseExamplesPanel(arg0: { operation: OpenAPIOperation; spec?: OpenAPISpec }): ReactNode {
  const { operation, spec } = arg0

  const t = useBuiltInText()
  const responses = getResponseEntries(operation, spec).filter(({ response }) => getMediaTypeEntries(response.content, spec).length > 0)
  const [selectedStatus, setSelectedStatus] = useState(responses.find(({ status }) => status.startsWith('2'))?.status ?? responses[0]?.status ?? '')
  const selectedResponse = responses.find(({ status }) => status === selectedStatus) ?? responses[0]
  const responseContents = getMediaTypeEntries(selectedResponse?.response.content, spec)
  const [selectedMediaType, setSelectedMediaType] = useState(responseContents[0]?.mediaType ?? '')
  const selectedContent = responseContents.find((content) => content.mediaType === selectedMediaType) ?? responseContents[0]
  const examples = getExampleEntries(selectedContent?.value)
  const [selectedExampleKey, setSelectedExampleKey] = useState(examples[0]?.key ?? '')
  const selectedExample = examples.find((example) => example.key === selectedExampleKey) ?? examples[0]
  const responseCode = stringifyExample(selectedExample?.value)

  if (!selectedResponse || !selectedContent || !responseCode) return null

  return (
    <ApiExampleCodeGroup
      title={t('openapi.response')}
      tag={selectedResponse.status}
      tagOptions={responses.map(({ status }) => status)}
      onSelectTag={(value) => {
        const nextResponse = responses.find(({ status }) => status === value)
        const nextContents = getMediaTypeEntries(nextResponse?.response.content, spec)
        setSelectedStatus(value)
        setSelectedMediaType(nextContents[0]?.mediaType ?? '')
        setSelectedExampleKey(getExampleEntries(nextContents[0]?.value)[0]?.key ?? '')
      }}
      label={selectedContent.mediaType}
      labelOptions={responseContents.map((content) => content.mediaType)}
      onSelectLabel={(value) => {
        setSelectedMediaType(value)
        setSelectedExampleKey(getExampleEntries(responseContents.find((content) => content.mediaType === value)?.value)[0]?.key ?? '')
      }}
      comfortableMeta
      code={responseCode}
      language={codeLanguageForMediaType(selectedContent.mediaType)}
      examples={examples}
      selectedExampleKey={selectedExample?.key}
      onSelectExample={setSelectedExampleKey}
    />
  )
}
