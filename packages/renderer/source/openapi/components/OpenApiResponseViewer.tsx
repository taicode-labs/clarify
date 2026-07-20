import clsx from 'clsx'
import { CheckIcon, CircleAlertIcon, CopyIcon, DownloadIcon, FileX2Icon, SearchIcon, SendIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

import { HighlightedCode } from '../../components/HighlightedCode'
import { Tabs } from '../../components/Tabs'
import { useBuiltInText } from '../../core/i18n'
import { copyTextToClipboard } from '../../utils/clipboard'
import type { ApiResponseExchange } from '../lib/api-exchange'

import { RequestSection } from './OpenApiRequestFields'

type BodyMode = 'preview' | 'raw'
type BodyModeSelection = { exchange: ApiResponseExchange; mode: BodyMode }

type OpenApiResponseViewerProps = {
  exchange?: ApiResponseExchange
  error?: string
}

type CopyButtonProps = {
  value: string
}

type ResponsePreviewProps = { exchange: ApiResponseExchange }
type ResponseHeadersProps = { headers: Array<[string, string]> }
type ResponseMediaProps = { blob: Blob; type: 'image' | 'audio' | 'video' }
type TextPreview = { code: string; language: string }
type ResponseStateProps = {
  icon: typeof SendIcon
  title: string
  description: string
  tone?: 'default' | 'error'
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

const textLanguages: Record<string, string> = {
  'application/graphql': 'graphql',
  'application/javascript': 'javascript',
  'application/sql': 'sql',
  'application/typescript': 'typescript',
  'application/xml': 'xml',
  'application/x-httpd-php': 'php',
  'application/x-sh': 'shellscript',
  'application/xhtml+xml': 'html',
  'application/x-www-form-urlencoded': 'http',
  'text/css': 'css',
  'text/csv': 'csv',
  'text/html': 'html',
  'text/javascript': 'javascript',
  'text/markdown': 'markdown',
  'text/plain': 'text',
  'text/xml': 'xml',
}

function normalizedMediaType(contentType: string): string {
  return contentType.split(';', 1)[0].trim().toLowerCase()
}

export function getResponseTextPreview(contentType: string, body: string): TextPreview | undefined {
  const mediaType = normalizedMediaType(contentType)

  if (mediaType === 'application/json' || mediaType.endsWith('+json')) {
    const parsed = parseJson(body)
    return { code: typeof parsed === 'undefined' ? body : JSON.stringify(parsed, null, 2), language: 'json' }
  }

  if (mediaType === 'application/yaml' || mediaType === 'application/x-yaml' || mediaType === 'text/yaml' || mediaType === 'text/x-yaml' || mediaType.endsWith('+yaml')) {
    try {
      return { code: stringifyYaml(parseYaml(body)).trimEnd(), language: 'yaml' }
    } catch {
      return { code: body, language: 'yaml' }
    }
  }

  const language = textLanguages[mediaType]
    ?? (mediaType.startsWith('text/') ? mediaType.slice('text/'.length) || 'text' : undefined)

  return language ? { code: body, language } : undefined
}

export function canPreviewResponse(contentType: string): boolean {
  const mediaType = normalizedMediaType(contentType)
  return Boolean(
    getResponseTextPreview(contentType, '')
    || mediaType.startsWith('image/')
    || mediaType.startsWith('audio/')
    || mediaType.startsWith('video/'),
  )
}

function ResponseState(arg0: ResponseStateProps): ReactNode {
  const { icon: Icon, title, description, tone = 'default' } = arg0
  const error = tone === 'error'

  return (
    <div className="grid min-h-56 flex-1 place-items-center px-6 py-10 text-center" role={error ? 'alert' : 'status'}>
      <div className="max-w-sm">
        <span className={clsx('mx-auto mb-3 grid size-10 place-items-center rounded-full border', error ? 'border-(--clarify-code-danger-border) bg-(--clarify-code-danger-background) text-(--clarify-code-danger)' : 'border-(--clarify-code-border) bg-(--clarify-code-control-background) text-(--clarify-code-muted)')}>
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
        <p className={clsx('text-sm font-semibold', error ? 'text-(--clarify-code-danger)' : 'text-(--clarify-code-text)')}>{title}</p>
        <p className="mt-1 text-xs/5 text-(--clarify-code-faint)">{description}</p>
      </div>
    </div>
  )
}

function CopyButton(arg0: CopyButtonProps): ReactNode {
  const { value } = arg0
  const t = useBuiltInText()
  const [copied, setCopied] = useState(false)

  async function copy() {
    const success = await copyTextToClipboard(value)
    setCopied(success)
    if (success) window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button type="button" onClick={copy} aria-label={copied ? t('actions.copied') : t('actions.copy')} title={copied ? t('actions.copied') : t('actions.copy')} className="grid size-8 shrink-0 place-items-center rounded-(--clarify-theme-tokens-radius-md) text-(--clarify-code-muted) hover:bg-(--clarify-code-control-background-hover) hover:text-(--clarify-code-text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)">
      {copied ? <CheckIcon className="size-4 text-(--clarify-code-success)" aria-hidden="true" /> : <CopyIcon className="size-4" aria-hidden="true" />}
    </button>
  )
}

function ResponseMedia(arg0: ResponseMediaProps): ReactNode {
  const { blob, type } = arg0
  const elementRef = useRef<HTMLImageElement & HTMLAudioElement & HTMLVideoElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    const url = URL.createObjectURL(blob)
    element.src = url
    return () => {
      element.removeAttribute('src')
      URL.revokeObjectURL(url)
    }
  }, [blob])

  if (type === 'image') return <img ref={elementRef} alt="" className="max-h-128 max-w-full object-contain" />
  if (type === 'audio') return <audio ref={elementRef} controls className="w-full" />
  return <video ref={elementRef} controls className="max-h-128 max-w-full" />
}

function ResponsePreview(arg0: ResponsePreviewProps): ReactNode {
  const { exchange } = arg0
  const t = useBuiltInText()
  const contentType = normalizedMediaType(exchange.contentType)
  if (!exchange.size) return <ResponseState icon={FileX2Icon} title={t('openapi.responseBodyEmptyTitle')} description={t('openapi.responseBodyEmpty')} />
  if (contentType.startsWith('image/')) return <ResponseMedia blob={exchange.blob} type="image" />
  if (contentType.startsWith('audio/')) return <ResponseMedia blob={exchange.blob} type="audio" />
  if (contentType.startsWith('video/')) return <ResponseMedia blob={exchange.blob} type="video" />
  if (contentType === 'text/html' || contentType === 'application/xhtml+xml') return <iframe srcDoc={exchange.body} sandbox="" title="Response preview" className="h-96 w-full border-0 bg-white" />
  const textPreview = getResponseTextPreview(exchange.contentType, exchange.body)
  if (textPreview) return <pre className="max-h-128 overflow-auto whitespace-pre-wrap wrap-break-word font-mono text-xs/5"><HighlightedCode code={textPreview.code} language={textPreview.language} /></pre>
  return <div className="grid min-h-56 place-items-center text-xs text-(--clarify-code-faint)">{t('openapi.binaryPreview')}</div>
}

function ResponseHeaders(arg0: ResponseHeadersProps): ReactNode {
  const { headers: sourceHeaders } = arg0
  const t = useBuiltInText()
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const headers = normalizedQuery ? sourceHeaders.filter(([name, value]) => `${name} ${value}`.toLowerCase().includes(normalizedQuery)) : sourceHeaders

  return (
    <div>
      <label className="flex h-9 items-center gap-2 border-b border-(--clarify-code-border) bg-(--clarify-code-control-background) px-3">
        <SearchIcon className="size-4 shrink-0 text-(--clarify-code-muted)" aria-hidden="true" />
        <span className="sr-only">{t('openapi.searchHeaders')}</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('openapi.searchHeaders')} className="min-w-0 flex-1 bg-transparent text-xs text-(--clarify-code-text) outline-none placeholder:text-(--clarify-code-faint)" />
      </label>
      <div className="overflow-x-auto">
        <table className="w-full min-w-96 table-fixed border-collapse text-left font-mono text-xs/5">
          <thead className="bg-(--clarify-code-control-background) text-(--clarify-code-muted)"><tr><th className="w-2/5 border-r border-(--clarify-code-border) px-3 py-2 font-semibold">{t('openapi.headerName')}</th><th className="px-3 py-2 font-semibold">{t('openapi.headerValue')}</th><th className="w-10"><span className="sr-only">{t('actions.copy')}</span></th></tr></thead>
          <tbody>{headers.map(([name, value], index) => <tr key={`${name}:${index}`} className="border-t border-(--clarify-code-border) hover:bg-(--clarify-code-control-background)"><td className="break-all border-r border-(--clarify-code-border) px-3 py-2 align-top text-(--clarify-code-property)">{name}</td><td className="break-all px-3 py-2 align-top text-(--clarify-code-text)">{value}</td><td className="pr-1"><CopyButton value={`${name}: ${value}`} /></td></tr>)}</tbody>
        </table>
      </div>
      {headers.length === 0 ? <p className="border-t border-(--clarify-code-border) py-8 text-center text-xs text-(--clarify-code-faint)">{t('openapi.noHeaders')}</p> : null}
    </div>
  )
}

function HiddenCookies(): ReactNode {
  const t = useBuiltInText()
  return (
    <table className="w-full table-fixed border-collapse text-left text-xs/5">
      <thead className="bg-(--clarify-code-control-background) text-(--clarify-code-muted)"><tr><th className="w-2/5 border-r border-(--clarify-code-border) px-3 py-2 font-semibold">{t('openapi.headerName')}</th><th className="px-3 py-2 font-semibold">{t('openapi.headerValue')}</th></tr></thead>
      <tbody><tr className="border-t border-(--clarify-code-border)"><td colSpan={2} className="px-3 py-5 text-center text-(--clarify-code-faint)">{t('openapi.cookiesBrowserHidden')}</td></tr></tbody>
    </table>
  )
}

export function OpenApiResponseViewer(arg0: OpenApiResponseViewerProps): ReactNode {
  const { exchange, error } = arg0
  const t = useBuiltInText()
  const [bodyModeSelection, setBodyModeSelection] = useState<BodyModeSelection>()
  const previewAvailable = exchange ? canPreviewResponse(exchange.contentType) : false
  const selectedBodyMode = bodyModeSelection && bodyModeSelection.exchange === exchange ? bodyModeSelection.mode : 'preview'
  const activeBodyMode = previewAvailable ? selectedBodyMode : 'raw'
  const bodyModes = (['preview', 'raw'] as BodyMode[]).filter(mode => mode === 'raw' || previewAvailable)

  function downloadBody() {
    if (!exchange) return
    const url = URL.createObjectURL(exchange.blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `response.${exchange.contentType.includes('json') ? 'json' : 'bin'}`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="clarify-api-response flex h-full min-h-96 min-w-0 flex-col bg-(--clarify-code-background) text-(--clarify-code-text)" aria-label={t('openapi.response')}>
      <div className="sticky top-0 z-10 flex min-h-11 flex-wrap items-center gap-2 border-b border-(--clarify-code-border) bg-(--clarify-code-header-background) px-2.5 text-sm font-medium">
        <span className="mr-auto text-(--clarify-code-text)">{t('openapi.response')}</span>
        {exchange ? <><span className="text-xs font-semibold text-(--clarify-code-muted)">{exchange.duration} ms</span><span className="text-xs text-(--clarify-code-faint)">{formatBytes(exchange.size)}</span><span className={clsx('size-2 rounded-full', exchange.status < 400 ? 'bg-(--clarify-code-success)' : 'bg-(--clarify-code-danger)')} /><span className={clsx('text-xs font-semibold', exchange.status < 400 ? 'text-(--clarify-code-success)' : 'text-(--clarify-code-danger)')}>{exchange.status} {exchange.statusText}</span></> : null}
      </div>
      {error ? <ResponseState icon={CircleAlertIcon} title={t('openapi.responseErrorTitle')} description={error} tone="error" /> : null}
      {!error && !exchange ? <ResponseState icon={SendIcon} title={t('openapi.responseEmptyTitle')} description={t('openapi.responseEmpty')} /> : null}
      {exchange ? <div className="min-h-0 flex-1 overflow-auto">
        <RequestSection title={t('openapi.cookies')} count={0}>
          <HiddenCookies />
        </RequestSection>
        <RequestSection title={t('openapi.requestHeaders')} count={exchange.request.headers.length}>
          <ResponseHeaders headers={exchange.request.headers} />
        </RequestSection>
        <RequestSection title={t('openapi.responseHeaders')} count={exchange.headers.length}>
          <ResponseHeaders headers={exchange.headers} />
        </RequestSection>
        <RequestSection title={t('openapi.body')} defaultOpen actions={<span className="font-mono text-2xs font-normal text-(--clarify-code-faint)">{exchange.contentType || t('openapi.unknownContentType')}</span>}>
          <Tabs
            items={bodyModes.map(mode => ({
              id: mode,
              label: mode === 'preview' ? t('openapi.preview') : t('openapi.raw'),
              panel: mode === 'preview'
                ? <ResponsePreview exchange={exchange} />
                : exchange.size
                  ? <pre className="max-h-128 overflow-auto whitespace-pre-wrap wrap-break-word font-mono text-xs/5">{exchange.body}</pre>
                  : <div className="py-8 text-center text-xs text-(--clarify-code-faint)">{t('openapi.responseBodyEmpty')}</div>,
            }))}
            selectedIndex={bodyModes.indexOf(activeBodyMode)}
            onChange={(index) => setBodyModeSelection({ exchange, mode: bodyModes[index] ?? 'raw' })}
            spacingClassName="m-0 min-h-72"
            panelsClassName="p-4"
            variant="code"
            actions={<><CopyButton value={exchange.body} /><button type="button" onClick={downloadBody} aria-label={t('openapi.downloadBody')} title={t('openapi.downloadBody')} className="grid size-8 shrink-0 place-items-center rounded-(--clarify-theme-tokens-radius-md) text-(--clarify-code-muted) transition hover:bg-(--clarify-code-control-background-hover) hover:text-(--clarify-code-text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)"><DownloadIcon className="size-4" aria-hidden="true" /></button></>}
          />
        </RequestSection>
      </div> : null}
    </section>
  )
}
