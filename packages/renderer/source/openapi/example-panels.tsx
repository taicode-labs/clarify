import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { CheckIcon, ChevronsUpDownIcon, ClipboardIcon, CodeIcon, PackageIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { useBuiltInText } from '../i18n'

import { codeLanguageForMediaType, getExampleEntries, getMediaTypeEntries, getResponseEntries, stringifyExample } from './helpers'
import { buildRequestCodeExamples } from './request-code'
import type { ExampleEntry, MediaTypeEntry, OpenApiParameter, RequestCodeExample } from './types'
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
}): ReactNode {
  const {
    label,
    value,
    options,
    onChange,
    icon,
  } = arg0

  const normalizedOptions = options.map((option) => (typeof option === 'string' ? { value: option, label: option } : option))
  const selectedOption = normalizedOptions.find((option) => option.value === value) ?? normalizedOptions[0]

  if (normalizedOptions.length <= 1) return null

  return (
    <Listbox value={value} onChange={onChange}>
      <div className="clarify-api-select relative text-xs">
        <ListboxButton
          aria-label={label}
          className="clarify-api-select-button flex min-w-28 items-center justify-between gap-2 rounded-lg bg-black/30 px-2 py-1 font-mono text-xs font-medium text-zinc-100 outline-hidden transition hover:bg-black/50 focus:ring-2 focus:ring-emerald-400/25 data-open:bg-white/10 data-open:ring-2 data-open:ring-emerald-400/25"
        >
          <span className="flex min-w-0 items-center gap-1.5">
            {icon ? <span className="shrink-0 text-zinc-500">{icon}</span> : null}
            <span className="truncate">{selectedOption?.label ?? value}</span>
          </span>
          <ChevronsUpDownIcon className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
        </ListboxButton>
        <ListboxOptions
          anchor="bottom end"
          className="clarify-api-select-options z-30 mt-1 max-h-64 w-(--button-width) min-w-40 overflow-auto rounded-xl bg-zinc-900 p-1 text-xs shadow-lg shadow-black/20 ring-1 ring-white/10 [--anchor-gap:--spacing(1)] focus:outline-none"
        >
          {normalizedOptions.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              className="clarify-api-select-option group flex cursor-default items-center justify-between gap-3 rounded-lg px-2.5 py-2 font-mono text-xs text-zinc-300 select-none data-focus:bg-white/10 data-focus:text-white data-selected:text-emerald-300"
            >
              <span className="truncate">{option.label}</span>
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

function CopyCodeButton(arg0: { code: string }): ReactNode {
  const { code } = arg0

  const t = useBuiltInText()
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      onClick={() => {
        void window.navigator.clipboard.writeText(code).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1000)
        })
      }}
      className="flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1.5 text-2xs font-medium text-zinc-400 transition hover:bg-black/50 hover:text-zinc-200 focus:bg-black/50 focus:text-zinc-200"
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
  label?: string
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
    label,
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

  return (
    <div className="clarify-api-example my-6 overflow-hidden rounded-2xl bg-zinc-900 shadow-md dark:ring-1 dark:ring-white/10">
      <div className="not-prose">
        <div className="clarify-api-example-header flex min-h-[calc(--spacing(12)+1px)] flex-wrap items-center gap-3 border-b border-zinc-700 bg-zinc-800 px-4 py-2 dark:border-zinc-800 dark:bg-transparent">
          <h3 className="mr-auto shrink-0 py-1 text-xs font-semibold text-white">{title}</h3>
          {mediaTypes && mediaTypes.length > 1 && selectedMediaType && onSelectMediaType ? (
            <SelectControl
              label={t('openapi.mediaType')}
              value={selectedMediaType}
              options={mediaTypes}
              onChange={onSelectMediaType}
            />
          ) : null}
          {examples && examples.length > 1 && selectedExampleKey && onSelectExample ? (
            <SelectControl
              label={t('openapi.example')}
              value={selectedExampleKey}
              options={examples.map((example) => ({ value: example.key, label: getExampleLabel(example, t) }))}
              onChange={onSelectExample}
            />
          ) : null}
        </div>
        {tag || label ? (
          <div className="flex h-9 items-center gap-2 border-y border-t-transparent border-b-white/7.5 bg-zinc-900 px-4 dark:border-b-white/5 dark:bg-white/1">
            {tag ? <span className="font-mono text-[0.625rem]/6 font-semibold text-emerald-400">{tag}</span> : null}
            {tag && label ? <span className="h-0.5 w-0.5 rounded-full bg-zinc-500" /> : null}
            {label ? <span className="font-mono text-xs text-zinc-400">{label}</span> : null}
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
}): ReactNode {
  const {
    spec,
    path,
    method,
    parameters,
    requestContents,
    selectedMediaType,
    onSelectMediaType,
  } = arg0

  const t = useBuiltInText()
  const selectedContent = requestContents.find((content) => content.mediaType === selectedMediaType) ?? requestContents[0]
  const examples = getExampleEntries(selectedContent?.value)
  const [selectedExampleKey, setSelectedExampleKey] = useState(examples[0]?.key ?? '')
  const [selectedLanguageKey, setSelectedLanguageKey] = useState('shell')
  const [selectedClientKey, setSelectedClientKey] = useState('curl')
  const selectedExample = examples.find((example) => example.key === selectedExampleKey) ?? examples[0]
  const requestContent = selectedContent ? { ...selectedContent, value: { ...selectedContent.value, example: selectedExample?.value, examples: undefined } } : undefined
  const codeOptions = buildRequestCodeExamples({ spec, path, method, parameters, requestContent })
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

export function ResponseExamplesPanel(arg0: { operation: OpenAPIOperation }): ReactNode {
  const { operation } = arg0

  const t = useBuiltInText()
  const responses = getResponseEntries(operation).filter(({ response }) => getMediaTypeEntries(response.content).length > 0)
  const [selectedStatus, setSelectedStatus] = useState(responses.find(({ status }) => status.startsWith('2'))?.status ?? responses[0]?.status ?? '')
  const selectedResponse = responses.find(({ status }) => status === selectedStatus) ?? responses[0]
  const responseContents = getMediaTypeEntries(selectedResponse?.response.content)
  const [selectedMediaType, setSelectedMediaType] = useState(responseContents[0]?.mediaType ?? '')
  const selectedContent = responseContents.find((content) => content.mediaType === selectedMediaType) ?? responseContents[0]
  const examples = getExampleEntries(selectedContent?.value)
  const [selectedExampleKey, setSelectedExampleKey] = useState(examples[0]?.key ?? '')
  const selectedExample = examples.find((example) => example.key === selectedExampleKey) ?? examples[0]
  const responseCode = stringifyExample(selectedExample?.value)

  if (!selectedResponse || !selectedContent || !responseCode) return null

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3">
        <SelectControl
          label={t('openapi.status')}
          value={selectedResponse.status}
          options={responses.map(({ status }) => status)}
          onChange={(value) => {
            const nextResponse = responses.find(({ status }) => status === value)
            const nextContents = getMediaTypeEntries(nextResponse?.response.content)
            setSelectedStatus(value)
            setSelectedMediaType(nextContents[0]?.mediaType ?? '')
            setSelectedExampleKey(getExampleEntries(nextContents[0]?.value)[0]?.key ?? '')
          }}
        />
        <SelectControl
          label={t('openapi.mediaType')}
          value={selectedContent.mediaType}
          options={responseContents.map((content) => content.mediaType)}
          onChange={(value) => {
            setSelectedMediaType(value)
            setSelectedExampleKey(getExampleEntries(responseContents.find((content) => content.mediaType === value)?.value)[0]?.key ?? '')
          }}
        />
      </div>
      <ApiExampleCodeGroup
        title={t('openapi.response')}
        tag={selectedResponse.status}
        label={selectedContent.mediaType}
        code={responseCode}
        language={codeLanguageForMediaType(selectedContent.mediaType)}
        examples={examples}
        selectedExampleKey={selectedExample?.key}
        onSelectExample={setSelectedExampleKey}
      />
    </div>
  )
}
