import clsx from 'clsx'
import { ChevronDownIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { useBuiltInText } from '../../core/i18n'
import { isRecord, resolveSchema, schemaToType } from '../lib/helpers'
import type { RequestParameterIssue } from '../lib/request-parameters'
import type { OpenAPISpec } from '../lib/utils'
import type { OpenApiParameter } from '../types'

import { InlineListbox } from './InlineListbox'

type RequestFieldProps = {
  spec: OpenAPISpec
  parameter: OpenApiParameter
  value: string
  enabled: boolean
  onChange: (value: string) => void
  onEnabledChange: (enabled: boolean) => void
  issue?: RequestParameterIssue
}

type RequestSectionProps = {
  title: string
  count?: number
  defaultOpen?: boolean
  actions?: ReactNode
  table?: boolean
  children: ReactNode
}

export function RequestField(arg0: RequestFieldProps): ReactNode {
  const { spec, parameter, value, enabled, onChange, onEnabledChange, issue } = arg0
  const t = useBuiltInText()
  const schema = resolveSchema(spec, parameter.schema)
  const schemaRecord = isRecord(schema) ? schema : undefined
  const options = Array.isArray(schemaRecord?.enum) ? schemaRecord.enum.map(String) : []
  const type = schemaToType(schema) ?? 'string'
  const structured = type.includes('[]') || type.includes('object')
  const boolean = type.includes('boolean')
  const numeric = type.includes('integer') || type.includes('number')
  const fieldId = `openapi-parameter-${parameter.in ?? 'query'}-${parameter.name ?? ''}`.replace(/[^a-zA-Z0-9_-]/g, '-')
  const issueText = issue === 'required' ? t('openapi.required') : issue ? t(`openapi.parameter${issue[0].toUpperCase()}${issue.slice(1)}` as Parameters<typeof t>[0]) : undefined
  const controlProps = {
    'aria-label': parameter.name,
    'aria-invalid': issue ? true as const : undefined,
    'aria-describedby': issue ? `${fieldId}-issue` : undefined,
    disabled: !enabled,
  }

  return (
    <div className="grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)] gap-x-2 gap-y-2 px-3 py-3 sm:grid-cols-[2.75rem_minmax(10rem,0.72fr)_minmax(0,1fr)] sm:items-start">
      <div className="flex justify-center border-r border-(--clarify-theme-tokens-colors-border) pt-0.5">
        <input
          type="checkbox"
          checked={enabled}
          disabled={parameter.required}
          onChange={(event) => onEnabledChange(event.target.checked)}
          aria-label={`${t('openapi.includeParameter')}: ${parameter.name ?? ''}`}
          className="size-3.5 shrink-0 accent-(--clarify-theme-tokens-colors-primary) disabled:cursor-not-allowed"
        />
      </div>
      <div className="min-w-0 sm:border-r sm:border-(--clarify-theme-tokens-colors-border) sm:pr-3">
        <label htmlFor={fieldId} className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs font-semibold text-(--clarify-ui-text-soft)">
          <span className="truncate">{parameter.name}</span>
          <span className="font-mono text-2xs font-normal text-(--clarify-ui-text-faint)">{type}</span>
          {parameter.required ? <span className="text-red-500">*</span> : null}
        </label>
        {parameter.description ? <div className="mt-1 text-xs/5 text-(--clarify-ui-text-faint)">{parameter.description}</div> : null}
      </div>
      <div className={clsx('col-start-2 min-w-0 sm:col-start-3 sm:row-start-1 sm:pl-1', !enabled && 'opacity-45')}>
      {options.length > 0 ? (
        <InlineListbox label={parameter.name ?? ''} value={value} options={[...(parameter.required ? [] : [{ value: '', label: t('openapi.none') }]), ...options.map((option) => ({ value: option, label: option }))]} onChange={onChange} invalid={Boolean(issue)} describedBy={issue ? `${fieldId}-issue` : undefined} disabled={!enabled} />
      ) : boolean ? (
        <input {...controlProps} id={fieldId} type="checkbox" checked={value === 'true'} onChange={(event) => onChange(String(event.target.checked))} className="size-4 accent-(--clarify-theme-tokens-colors-primary)" />
      ) : structured ? (
        <textarea {...controlProps} id={fieldId} value={value} required={parameter.required} onChange={(event) => onChange(event.target.value)} rows={3} spellCheck={false} placeholder={type.includes('[]') ? '[]' : '{}'} className="w-full resize-y rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-code-background) p-2.5 font-mono text-xs/5 text-(--clarify-code-text) outline-hidden aria-invalid:border-red-500 focus:border-(--clarify-theme-tokens-colors-primary)" />
      ) : (
        <input {...controlProps} id={fieldId} value={value} type={numeric ? 'number' : schemaRecord?.format === 'date' ? 'date' : schemaRecord?.format === 'date-time' ? 'datetime-local' : 'text'} required={parameter.required} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) px-2.5 font-mono text-xs text-(--clarify-theme-tokens-colors-foreground) outline-hidden transition placeholder:text-(--clarify-ui-text-faint) aria-invalid:border-red-500 focus:border-(--clarify-theme-tokens-colors-primary) focus:ring-2 focus:ring-(--clarify-theme-tokens-colors-primary)/15" />
      )}
      </div>
      {issueText ? <span id={`${fieldId}-issue`} className="col-start-2 text-xs/5 font-medium text-red-600 sm:col-start-3 sm:pl-1">{issueText}</span> : null}
    </div>
  )
}

export function RequestSection(arg0: RequestSectionProps): ReactNode {
  const { title, count, defaultOpen, actions, table = false, children } = arg0
  const t = useBuiltInText()
  return (
    <details open={defaultOpen} className="group border-b border-(--clarify-theme-tokens-colors-border) last:border-b-0">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-xs font-bold text-(--clarify-ui-text-strong) hover:bg-(--clarify-ui-hover-background)">
        <ChevronDownIcon className="size-4 shrink-0 -rotate-90 transition group-open:rotate-0" aria-hidden="true" />
        <span className="flex-1">{title}</span>
        {typeof count === 'number' ? <span className="rounded bg-(--clarify-ui-subtle-background) px-1.5 py-0.5 font-mono text-2xs text-(--clarify-ui-text-faint)">{count}</span> : null}
        {actions ? <span className="flex items-center gap-1" onClick={(event) => { event.preventDefault(); event.stopPropagation() }}>{actions}</span> : null}
      </summary>
      {table ? <div className="border-t border-(--clarify-theme-tokens-colors-border)">
        <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-2 border-b border-(--clarify-theme-tokens-colors-border) bg-(--clarify-ui-subtle-background) px-3 py-2 text-2xs font-semibold uppercase text-(--clarify-ui-text-faint) sm:grid-cols-[2.75rem_minmax(10rem,0.72fr)_minmax(0,1fr)]">
          <span className="border-r border-(--clarify-theme-tokens-colors-border) text-center">{t('openapi.includeParameter')}</span>
          <span className="sm:border-r sm:border-(--clarify-theme-tokens-colors-border) sm:pr-3">{t('openapi.headerName')}</span>
          <span className="col-start-2 sm:col-start-3 sm:pl-1">{t('openapi.headerValue')}</span>
        </div>
        <div className="divide-y divide-(--clarify-theme-tokens-colors-border)">{children}</div>
      </div> : <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2">{children}</div>}
    </details>
  )
}
