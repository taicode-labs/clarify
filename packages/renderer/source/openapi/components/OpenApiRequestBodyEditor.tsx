import type { ChangeEvent, ReactNode } from 'react'

import { isRecord, resolveSchema, schemaHasType, schemaToType } from '../lib/helpers'
import type { OpenAPISpec } from '../lib/utils'
import type { OpenApiMediaType } from '../types'

type OpenApiRequestBodyEditorProps = {
  spec: OpenAPISpec
  mediaType: string
  content?: OpenApiMediaType
  body: string
  files: Record<string, File>
  onBodyChange: (value: string) => void
  onFileChange: (name: string, file?: File) => void
}

function parseBodyRecord(body: string): Record<string, unknown> {
  try {
    const value = JSON.parse(body)
    return isRecord(value) ? value : {}
  } catch {
    return {}
  }
}

function isBinarySchema(schema: unknown): boolean {
  return isRecord(schema) && schema.format === 'binary'
}

function isTextMediaType(mediaType: string): boolean {
  return mediaType.startsWith('text/')
    || mediaType.includes('json')
    || mediaType.includes('xml')
    || mediaType.includes('yaml')
    || mediaType.includes('javascript')
    || mediaType.includes('form')
}

function isFormMediaType(mediaType: string): boolean {
  const normalized = mediaType.split(';', 1)[0].trim().toLowerCase()
  return normalized === 'application/x-www-form-urlencoded' || normalized === 'multipart/form-data'
}

function valueFromInput(schema: unknown, value: string): unknown {
  if (!isRecord(schema)) return value
  if (schemaHasType(schema, 'integer')) return value === '' ? '' : Number.parseInt(value, 10)
  if (schemaHasType(schema, 'number')) return value === '' ? '' : Number(value)
  if (schemaHasType(schema, 'boolean')) return value === 'true'
  if (schemaHasType(schema, 'array') || schemaHasType(schema, 'object')) {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

export function OpenApiRequestBodyEditor(arg0: OpenApiRequestBodyEditorProps): ReactNode {
  const { spec, mediaType, content, body, files, onBodyChange, onFileChange } = arg0
  const schema = resolveSchema(spec, content?.schema)
  const schemaRecord = isRecord(schema) ? schema : undefined
  const properties = isRecord(schemaRecord?.properties) ? schemaRecord.properties : undefined
  const required = new Set(Array.isArray(schemaRecord?.required) ? schemaRecord.required.map(String) : [])
  const values = parseBodyRecord(body)

  function updateProperty(name: string, propertySchema: unknown, value: string) {
    onBodyChange(JSON.stringify({ ...values, [name]: valueFromInput(propertySchema, value) }, null, 2))
  }

  function renderProperty(name: string, unresolvedSchema: unknown) {
    const propertySchema = resolveSchema(spec, unresolvedSchema)
    const propertyRecord = isRecord(propertySchema) ? propertySchema : undefined
    const type = schemaToType(propertySchema) ?? 'string'
    const value = values[name]
    const fieldId = `openapi-request-body-${name}`.replace(/[^a-zA-Z0-9_-]/g, '-')
    const options = Array.isArray(propertyRecord?.enum) ? propertyRecord.enum : []
    const structured = schemaHasType(propertySchema, 'array') || schemaHasType(propertySchema, 'object')
    const serializedValue = structured && typeof value !== 'undefined' ? JSON.stringify(value, null, 2) : String(value ?? '')

    let control: ReactNode
    if (isBinarySchema(propertySchema)) {
      control = <input id={fieldId} aria-label={name} type="file" required={required.has(name)} onChange={(event: ChangeEvent<HTMLInputElement>) => onFileChange(name, event.target.files?.[0])} className="min-h-8 w-full px-2 py-1 text-xs text-(--clarify-theme-tokens-colors-foreground) file:mr-2 file:rounded-(--clarify-theme-tokens-radius-md) file:border file:border-(--clarify-theme-tokens-colors-border) file:bg-(--clarify-ui-subtle-background) file:px-2 file:py-1 file:text-xs file:text-(--clarify-ui-text-strong)" />
    } else if (options.length > 0) {
      control = <select id={fieldId} aria-label={name} value={serializedValue} required={required.has(name)} onChange={(event) => updateProperty(name, propertySchema, event.target.value)} className="h-8 w-full border-0 bg-transparent px-2 font-mono text-xs text-(--clarify-theme-tokens-colors-foreground) outline-hidden focus:bg-(--clarify-ui-hover-background)">{!required.has(name) ? <option value="" /> : null}{options.map((option) => <option key={String(option)} value={String(option)}>{String(option)}</option>)}</select>
    } else if (schemaHasType(propertySchema, 'boolean')) {
      control = <input id={fieldId} aria-label={name} type="checkbox" checked={value === true} onChange={(event) => updateProperty(name, propertySchema, String(event.target.checked))} className="size-4 accent-(--clarify-theme-tokens-colors-primary)" />
    } else if (structured) {
      control = <textarea id={fieldId} aria-label={name} value={serializedValue} required={required.has(name)} rows={3} spellCheck={false} onChange={(event) => updateProperty(name, propertySchema, event.target.value)} className="w-full resize-y border-0 bg-transparent p-2 font-mono text-xs/5 text-(--clarify-theme-tokens-colors-foreground) outline-hidden focus:bg-(--clarify-ui-hover-background)" />
    } else {
      const numeric = schemaHasType(propertySchema, 'integer') || schemaHasType(propertySchema, 'number')
      control = <input id={fieldId} aria-label={name} value={serializedValue} type={numeric ? 'number' : propertyRecord?.format === 'date' ? 'date' : propertyRecord?.format === 'date-time' ? 'datetime-local' : 'text'} required={required.has(name)} onChange={(event) => updateProperty(name, propertySchema, event.target.value)} className="h-8 w-full border-0 bg-transparent px-2 font-mono text-xs text-(--clarify-theme-tokens-colors-foreground) outline-hidden focus:bg-(--clarify-ui-hover-background)" />
    }

    return (
      <div key={name} className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <label htmlFor={fieldId} className="flex min-h-8 min-w-0 items-center gap-1.5 border-r border-(--clarify-theme-tokens-colors-border) px-2 text-xs text-(--clarify-ui-text-strong)">
          <span className="truncate font-mono">{name}</span>
          <span className="font-mono text-2xs text-(--clarify-ui-text-faint)">{type}</span>
          {required.has(name) ? <span className="text-(--clarify-error-accent-text)">*</span> : null}
        </label>
        <div className="flex min-w-0 items-center">{control}{files[name] ? <span className="sr-only">{files[name].name}</span> : null}</div>
      </div>
    )
  }

  if (properties && isFormMediaType(mediaType)) return <div className="divide-y divide-(--clarify-theme-tokens-colors-border)">{Object.entries(properties).map(([name, propertySchema]) => renderProperty(name, propertySchema))}</div>

  if (isBinarySchema(schema) || !isTextMediaType(mediaType)) {
    return <div className="flex min-h-44 items-start p-3"><input aria-label={mediaType} type="file" onChange={(event: ChangeEvent<HTMLInputElement>) => onFileChange('', event.target.files?.[0])} className="w-full text-xs text-(--clarify-theme-tokens-colors-foreground) file:mr-2 file:rounded-(--clarify-theme-tokens-radius-md) file:border file:border-(--clarify-theme-tokens-colors-border) file:bg-(--clarify-ui-subtle-background) file:px-2 file:py-1 file:text-xs file:text-(--clarify-ui-text-strong)" /></div>
  }

  return <textarea aria-label={mediaType} value={body} onChange={(event) => onBodyChange(event.target.value)} spellCheck={false} className="block h-full min-h-44 w-full resize-none border-0 bg-(--clarify-code-background) p-3 font-mono text-xs/5 text-(--clarify-code-text) outline-hidden focus:ring-2 focus:ring-inset focus:ring-(--clarify-theme-tokens-colors-primary)" />
}
