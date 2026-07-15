import clsx from 'clsx'
import { ChevronDownIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { useBuiltInText } from '../../core/i18n'
import { isRecord, resolveSchema, schemaToType } from '../lib/helpers'
import type { RequestParameterIssue } from '../lib/request-parameters'
import type { OpenAPISpec } from '../lib/utils'
import type { OpenApiParameter } from '../types'

import { InlineListbox, MultiInlineListbox } from './InlineListbox'

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
  className?: string
  contentClassName?: string
  children: ReactNode
}

export function RequestField(arg0: RequestFieldProps): ReactNode {
  const { spec, parameter, value, enabled, onChange, onEnabledChange, issue } = arg0
  const t = useBuiltInText()
  const schema = resolveSchema(spec, parameter.schema)
  const schemaRecord = isRecord(schema) ? schema : undefined
  const itemSchema = isRecord(schemaRecord?.items) ? schemaRecord.items : undefined
  const options = Array.isArray(schemaRecord?.enum) ? schemaRecord.enum.map(String) : []
  const itemOptions = Array.isArray(itemSchema?.enum) ? itemSchema.enum.map(String) : []
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
  const arrayValue = (() => {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
      return []
    }
  })()

  return (
    <div className="group grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] sm:grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] sm:items-stretch">
      <div className="flex min-h-8 items-center justify-center border-r border-(--clarify-theme-tokens-colors-border)">
        <input
          type="checkbox"
          checked={enabled}
          disabled={parameter.required}
          onChange={(event) => onEnabledChange(event.target.checked)}
          aria-label={`${t('openapi.includeParameter')}: ${parameter.name ?? ''}`}
          className="size-3.5 shrink-0 accent-(--clarify-theme-tokens-colors-primary) disabled:cursor-not-allowed"
        />
      </div>
      <div className="flex min-h-8 min-w-0 items-center border-r border-(--clarify-theme-tokens-colors-border) px-2">
        <label htmlFor={fieldId} className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs text-(--clarify-ui-text-strong)">
          <span className="truncate font-mono">{parameter.name}</span>
          <span className="font-mono text-2xs text-(--clarify-ui-text-faint)">{type}</span>
          {parameter.required ? <span className="text-(--clarify-error-accent-text)">*</span> : null}
        </label>
      </div>
      <div className={clsx('col-start-2 min-w-0 border-t border-(--clarify-theme-tokens-colors-border) sm:col-start-3 sm:row-start-1 sm:border-t-0', !enabled && 'opacity-45')}>
      {itemOptions.length > 0 ? (
        <MultiInlineListbox label={parameter.name ?? ''} value={arrayValue} options={itemOptions.map((option) => ({ value: option, label: option }))} onChange={(next) => onChange(JSON.stringify(next))} invalid={Boolean(issue)} describedBy={issue ? `${fieldId}-issue` : undefined} disabled={!enabled} />
      ) : options.length > 0 ? (
        <InlineListbox label={parameter.name ?? ''} value={value} options={[...(parameter.required ? [] : [{ value: '', label: t('openapi.none') }]), ...options.map((option) => ({ value: option, label: option }))]} onChange={onChange} invalid={Boolean(issue)} describedBy={issue ? `${fieldId}-issue` : undefined} disabled={!enabled} />
      ) : boolean ? (
        <input {...controlProps} id={fieldId} type="checkbox" checked={value === 'true'} onChange={(event) => onChange(String(event.target.checked))} className="size-4 accent-(--clarify-theme-tokens-colors-primary)" />
      ) : structured ? (
        <textarea {...controlProps} id={fieldId} value={value} required={parameter.required} onChange={(event) => onChange(event.target.value)} rows={3} spellCheck={false} placeholder={type.includes('[]') ? '[]' : '{}'} className="w-full resize-y border-0 bg-transparent p-2 font-mono text-xs/5 text-(--clarify-theme-tokens-colors-foreground) outline-hidden aria-invalid:text-(--clarify-error-accent-text) focus:bg-(--clarify-ui-hover-background)" />
      ) : (
        <input {...controlProps} id={fieldId} value={value} type={numeric ? 'number' : schemaRecord?.format === 'date' ? 'date' : schemaRecord?.format === 'date-time' ? 'datetime-local' : 'text'} required={parameter.required} onChange={(event) => onChange(event.target.value)} className="h-8 w-full border-0 bg-transparent px-2 font-mono text-xs text-(--clarify-theme-tokens-colors-foreground) outline-hidden transition placeholder:text-(--clarify-ui-text-faint) focus:bg-(--clarify-ui-hover-background) aria-invalid:text-(--clarify-error-accent-text)" />
      )}
      </div>
      {issueText ? <span id={`${fieldId}-issue`} className="col-start-2 border-t border-(--clarify-theme-tokens-colors-border) px-2 py-1 text-xs/5 font-medium text-(--clarify-error-accent-text) sm:col-start-3">{issueText}</span> : null}
    </div>
  )
}

export function RequestSection(arg0: RequestSectionProps): ReactNode {
  const { title, count, defaultOpen, actions, className, contentClassName, children } = arg0
  return (
    <details open={defaultOpen} className={clsx('group border-b border-(--clarify-theme-tokens-colors-border)', className)}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 bg-(--clarify-ui-subtle-background) px-2.5 text-sm font-medium text-(--clarify-ui-text-strong) hover:bg-(--clarify-ui-hover-background) group-open:border-b group-open:border-(--clarify-theme-tokens-colors-border)">
        <ChevronDownIcon className="size-4 shrink-0 -rotate-90 transition group-open:rotate-0" aria-hidden="true" />
        <span className="flex-1">{title}</span>
        {typeof count === 'number' ? <span className="font-mono text-xs text-(--clarify-ui-text-faint)">{count}</span> : null}
        {actions ? <span className="flex items-center gap-1" onClick={(event) => { event.preventDefault(); event.stopPropagation() }}>{actions}</span> : null}
      </summary>
      <div className={clsx('divide-y divide-(--clarify-theme-tokens-colors-border)', contentClassName)}>{children}</div>
    </details>
  )
}
