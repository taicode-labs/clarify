import { useState, type ReactNode } from 'react'

import { HighlightedCode } from '../../components/HighlightedCode'
import { useBuiltInText } from '../../core/i18n'
import { codeLanguageForMediaType, getExampleEntries, getMediaTypeEntries, getResponseEntries, stringifyExample } from '../lib/helpers'
import { buildRequestCodeExamples } from '../lib/request-code'
import type { OpenAPIOperation, OpenAPIOperationSource, OpenAPISpec } from '../lib/utils'
import type {
  ExampleEntry,
  MediaTypeEntry,
  OpenApiParameter,
  RequestAuthInput,
} from '../types'


import { ExampleMetaValue, CodeToolbar } from './CodeDisplay'
import {
  getExampleLabel,
  getLanguageOptions,
  getClientOptions,
} from './helpers'
import { SelectControl, type SelectOption } from './SelectControl'

type ApiExampleCodeGroupProps = {
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
}

function ApiExampleCodeGroup(arg0: ApiExampleCodeGroupProps): ReactNode {
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
    ? 'flex min-h-11 min-w-0 items-center gap-2 border-y border-(--clarify-code-border) border-t-transparent bg-(--clarify-code-background) px-4 py-2'
    : 'flex h-9 min-w-0 items-center gap-2 border-y border-(--clarify-code-border) border-t-transparent bg-(--clarify-code-background) px-4'

  return (
    <div className="clarify-api-example my-6 overflow-hidden rounded-2xl bg-(--clarify-code-background) shadow-md ring-1 ring-(--clarify-code-border)">
      <div className="not-prose">
        <div className="clarify-api-example-header flex min-h-(--clarify-code-header-min-height) items-center gap-3 border-b border-(--clarify-code-border) bg-(--clarify-code-header-background) px-4 py-2">
          <h3 className="mr-auto min-w-16 truncate py-1 text-xs font-semibold text-(--clarify-code-text)">{title}</h3>
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
                className="clarify-api-example-status font-semibold text-emerald-400"
              />
            ) : null}
            {tag && label ? <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-(--clarify-code-faint)" /> : null}
            {label ? (
              <ExampleMetaValue
                label={t('openapi.mediaType')}
                value={label}
                options={labelOptions}
                onChange={onSelectLabel}
                className="min-w-0 truncate text-xs text-(--clarify-code-muted)"
              />
            ) : null}
          </div>
        ) : null}
        <div className="clarify-api-example-code group bg-(--clarify-code-background)">
          <CodeToolbar
            code={code}
            languageOptions={languageOptions}
            selectedLanguageKey={selectedLanguageKey}
            onSelectLanguage={onSelectLanguage}
            clientOptions={clientOptions}
            selectedClientKey={selectedClientKey}
            onSelectClient={onSelectClient}
          />
          <pre className="max-h-128 overflow-auto overscroll-contain px-4 pt-3 pb-4 text-xs text-(--clarify-code-text)">
            <HighlightedCode code={code} language={language} />
          </pre>
        </div>
      </div>
    </div>
  )
}

type RequestExamplesPanelProps = {
  spec: OpenAPISpec
  path: string
  method: string
  parameters: OpenApiParameter[]
  requestContents: MediaTypeEntry[]
  selectedMediaType: string
  onSelectMediaType: (value: string) => void
  selectedServer: Parameters<typeof buildRequestCodeExamples>[0]['server']
  serverVariables: Record<string, string>
  auth?: RequestAuthInput
  operationSource?: OpenAPIOperationSource
  sharedExampleKey?: string
  onSelectExampleKey?: (value: string) => void
}

type UseRequestExamplesStateArgs = {
  spec: OpenAPISpec
  path: string
  method: string
  parameters: OpenApiParameter[]
  requestContents: MediaTypeEntry[]
  selectedMediaType: string
  onSelectMediaType: (value: string) => void
  selectedServer: Parameters<typeof buildRequestCodeExamples>[0]['server']
  serverVariables: Record<string, string>
  auth?: RequestAuthInput
  operationSource?: OpenAPIOperationSource
  sharedExampleKey?: string
  onSelectExampleKey?: (value: string) => void
}

function firstExampleKeyForMediaType(requestContents: MediaTypeEntry[], mediaType: string, spec?: OpenAPISpec): string {
  return getExampleEntries(requestContents.find((content) => content.mediaType === mediaType)?.value, spec)[0]?.key ?? ''
}

function useRequestExamplesState(arg0: UseRequestExamplesStateArgs) {
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
    operationSource,
    sharedExampleKey,
    onSelectExampleKey,
  } = arg0

  const selectedContent = requestContents.find((content) => content.mediaType === selectedMediaType) ?? requestContents[0]
  const examples = getExampleEntries(selectedContent?.value, spec)
  const [selectedExampleKey, setSelectedExampleKey] = useState(examples[0]?.key ?? '')
  const [selectedLanguageKey, setSelectedLanguageKey] = useState('shell')
  const [selectedClientKey, setSelectedClientKey] = useState('curl')

  const linkedExampleKey = sharedExampleKey && examples.some((example) => example.key === sharedExampleKey) ? sharedExampleKey : undefined
  const currentExampleKey = linkedExampleKey ?? selectedExampleKey
  const selectedExample = examples.find((example) => example.key === currentExampleKey) ?? examples[0]
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
    operationSource,
  })
  const selectedLanguage = codeOptions.find((option) => option.languageKey === selectedLanguageKey) ?? codeOptions[0]
  const selectedCode =
    codeOptions.find((option) => option.languageKey === selectedLanguage.languageKey && option.clientKey === selectedClientKey) ??
    selectedLanguage
  const languageOptions = getLanguageOptions(codeOptions)
  const clientOptions = getClientOptions(codeOptions, selectedCode.languageKey)

  return {
    selectedContent,
    selectedExample,
    selectedCode,
    languageOptions,
    clientOptions,
    examples,
    onSelectMediaType: (value: string) => {
      onSelectMediaType(value)
      setSelectedExampleKey(firstExampleKeyForMediaType(requestContents, value, spec))
    },
    onSelectExample: (value: string) => {
      setSelectedExampleKey(value)
      onSelectExampleKey?.(value)
    },
    onSelectLanguage: (value: string) => {
      const nextCode = codeOptions.find((option) => option.languageKey === value)
      setSelectedLanguageKey(nextCode?.languageKey ?? value)
      setSelectedClientKey(nextCode?.clientKey ?? '')
    },
    onSelectClient: setSelectedClientKey,
  }
}

export function RequestExamplesPanel(arg0: RequestExamplesPanelProps): ReactNode {
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
    operationSource,
    sharedExampleKey,
    onSelectExampleKey,
  } = arg0

  const t = useBuiltInText()
  const state = useRequestExamplesState({
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
    operationSource,
    sharedExampleKey,
    onSelectExampleKey,
  })

  return (
    <ApiExampleCodeGroup
      title={t('openapi.request')}
      tag={method}
      label={path}
      code={state.selectedCode.code}
      language={state.selectedCode.language}
      mediaTypes={requestContents.map((content) => content.mediaType)}
      selectedMediaType={state.selectedContent?.mediaType}
      onSelectMediaType={state.onSelectMediaType}
      examples={state.examples}
      selectedExampleKey={state.selectedExample?.key}
      onSelectExample={state.onSelectExample}
      languageOptions={state.languageOptions}
      selectedLanguageKey={state.selectedCode.languageKey}
      onSelectLanguage={state.onSelectLanguage}
      clientOptions={state.clientOptions}
      selectedClientKey={state.selectedCode.clientKey}
      onSelectClient={state.onSelectClient}
    />
  )
}

type ResponseExamplesPanelProps = {
  operation: OpenAPIOperation
  spec?: OpenAPISpec
  title?: string
  sharedExampleKey?: string
  onSelectExampleKey?: (value: string) => void
  selectedStatus?: string
  onSelectStatus?: (value: string) => void
}

type UseResponseExamplesStateArgs = {
  operation: OpenAPIOperation
  spec?: OpenAPISpec
  sharedExampleKey?: string
  onSelectExampleKey?: (value: string) => void
  selectedStatus?: string
  onSelectStatus?: (value: string) => void
}

function firstExampleKeyForResponseContent(content?: MediaTypeEntry, spec?: OpenAPISpec): string {
  return getExampleEntries(content?.value, spec)[0]?.key ?? ''
}

export function getResponseExampleBody(content: MediaTypeEntry | undefined, example: ExampleEntry | undefined): string {
  return content ? stringifyExample(example?.value) : ''
}

type ResponseSelectionState = {
  status: string
  mediaType: string
  exampleKey: string
}

function useResponseExamplesState(arg0: UseResponseExamplesStateArgs) {
  const { operation, spec, sharedExampleKey, onSelectExampleKey, selectedStatus, onSelectStatus } = arg0
  const responses = getResponseEntries(operation, spec)
  const orderedResponses = [...responses].sort((left, right) => {
    if (left.status === 'default') return -1
    if (right.status === 'default') return 1

    const leftCode = Number(left.status)
    const rightCode = Number(right.status)

    if (!Number.isNaN(leftCode) && !Number.isNaN(rightCode)) return leftCode - rightCode
    return left.status.localeCompare(right.status)
  })
  const defaultStatus = orderedResponses.find(({ status }) => status === 'default')?.status
    ?? orderedResponses.find(({ status }) => status.startsWith('2'))?.status
    ?? orderedResponses[0]?.status
    ?? ''
  const [internalSelectedStatus, setInternalSelectedStatus] = useState(defaultStatus)
  const activeStatus = selectedStatus ?? internalSelectedStatus
  const selectedResponse = orderedResponses.find(({ status }) => status === activeStatus) ?? orderedResponses[0]
  const responseContents = getMediaTypeEntries(selectedResponse?.response.content, spec)
  const [selection, setSelection] = useState<ResponseSelectionState>(() => ({
    status: activeStatus,
    mediaType: responseContents[0]?.mediaType ?? '',
    exampleKey: firstExampleKeyForResponseContent(responseContents[0], spec),
  }))
  const resolvedSelection = selection.status === activeStatus
    ? selection
    : {
        status: activeStatus,
        mediaType: responseContents[0]?.mediaType ?? '',
          exampleKey: firstExampleKeyForResponseContent(responseContents[0], spec),
      }
  const selectedContent = responseContents.find((content) => content.mediaType === resolvedSelection.mediaType) ?? responseContents[0]
  const examples = getExampleEntries(selectedContent?.value, spec)
  const selectedExampleKey = examples.some((example) => example.key === resolvedSelection.exampleKey) ? resolvedSelection.exampleKey : examples[0]?.key ?? ''
  const linkedExampleKey = sharedExampleKey && examples.some((example) => example.key === sharedExampleKey) ? sharedExampleKey : undefined
  const currentExampleKey = linkedExampleKey ?? selectedExampleKey
  const selectedExample = examples.find((example) => example.key === currentExampleKey) ?? examples[0]
  const responseBody = getResponseExampleBody(selectedContent, selectedExample)

  return {
    responses: orderedResponses,
    selectedResponse,
    responseContents,
    selectedContent,
    examples,
    selectedExample,
    responseBody,
    onSelectStatus: (value: string) => {
      const nextResponse = orderedResponses.find(({ status }) => status === value)
      const nextContents = getMediaTypeEntries(nextResponse?.response.content, spec)
      if (typeof selectedStatus === 'undefined') setInternalSelectedStatus(value)
      onSelectStatus?.(value)
      setSelection({
        status: value,
        mediaType: nextContents[0]?.mediaType ?? '',
        exampleKey: firstExampleKeyForResponseContent(nextContents[0], spec),
      })
    },
    onSelectMediaType: (value: string) => {
      const nextContent = responseContents.find((content) => content.mediaType === value)
      setSelection((current) => ({
        ...current,
        mediaType: value,
        exampleKey: firstExampleKeyForResponseContent(nextContent, spec),
      }))
    },
    onSelectExample: (value: string) => {
      setSelection((current) => ({
        ...current,
        exampleKey: value,
      }))
      onSelectExampleKey?.(value)
    },
  }
}

export function ResponseExamplesPanel(arg0: ResponseExamplesPanelProps): ReactNode {
  const { operation, spec, title, sharedExampleKey, onSelectExampleKey, selectedStatus, onSelectStatus } = arg0

  const t = useBuiltInText()
  const state = useResponseExamplesState({ operation, spec, sharedExampleKey, onSelectExampleKey, selectedStatus, onSelectStatus })

  if (!state.selectedContent || !state.responseBody) return null

  return (
    <ApiExampleCodeGroup
      title={title ?? t('openapi.response')}
      label={state.selectedContent?.mediaType}
      labelOptions={state.responseContents.map((content) => content.mediaType)}
      onSelectLabel={state.responseContents.length > 0 ? state.onSelectMediaType : undefined}
      code={state.responseBody}
      language={codeLanguageForMediaType(state.selectedContent.mediaType)}
      examples={state.examples}
      selectedExampleKey={state.selectedExample?.key}
      onSelectExample={state.onSelectExample}
    />
  )
}

// Re-export helpers for backward compatibility
export {
  getServers,
  getServerKey,
  getServerLabel,
  defaultServerVariables,
  authPlaceholder,
  authLabel,
  getAuthOptions,
  type AuthOption,
} from './helpers'
