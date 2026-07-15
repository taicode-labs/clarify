import clsx from 'clsx'
import { CheckIcon, ChevronDownIcon, CopyIcon, DownloadIcon, SearchIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { useBuiltInText } from '../../core/i18n'
import { copyTextToClipboard } from '../../utils/clipboard'
import type { ApiResponseExchange } from '../lib/api-exchange'
import { isRecord } from '../lib/helpers'

type BodyMode = 'preview' | 'raw'

type OpenApiResponseViewerProps = {
  exchange?: ApiResponseExchange
  error?: string
}

type CopyButtonProps = {
  value: string
}

type JsonPreviewProps = { value: unknown }
type ResponsePreviewProps = { exchange: ApiResponseExchange }
type ResponseHeadersProps = { headers: Array<[string, string]> }
type ResponseMediaProps = { blob: Blob; type: 'image' | 'audio' | 'video' }

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

function JsonPreview(arg0: JsonPreviewProps): ReactNode {
  const { value } = arg0
  if (Array.isArray(value)) return <div className="space-y-1 border-l border-(--clarify-code-border) pl-3">{value.map((item, index) => <div key={index}><span className="mr-2 text-(--clarify-code-faint)">{index}</span><JsonPreview value={item} /></div>)}</div>
  if (isRecord(value)) return <div className="space-y-1 border-l border-(--clarify-code-border) pl-3">{Object.entries(value).map(([key, item]) => <div key={key} className="grid grid-cols-[minmax(5rem,auto)_1fr] gap-3"><span className="text-sky-300">{key}</span><JsonPreview value={item} /></div>)}</div>
  if (value === null) return <span className="text-(--clarify-code-faint)">null</span>
  if (typeof value === 'string') return <span className="wrap-break-word text-emerald-300">{value}</span>
  return <span className="text-amber-300">{String(value)}</span>
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
    <button type="button" onClick={copy} aria-label={copied ? t('actions.copied') : t('actions.copy')} title={copied ? t('actions.copied') : t('actions.copy')} className="grid size-8 shrink-0 place-items-center rounded-md text-(--clarify-code-muted) hover:bg-(--clarify-code-control-background-hover) hover:text-(--clarify-code-text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)">
      {copied ? <CheckIcon className="size-4 text-emerald-300" aria-hidden="true" /> : <CopyIcon className="size-4" aria-hidden="true" />}
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
  const contentType = exchange.contentType.toLowerCase()
  if (!exchange.size) return <div className="grid min-h-56 place-items-center text-xs text-(--clarify-code-faint)">{t('openapi.responseBodyEmpty')}</div>
  if (contentType.includes('json')) {
    const parsed = parseJson(exchange.body)
    return typeof parsed === 'undefined' ? <pre className="whitespace-pre-wrap wrap-break-word font-mono text-xs/5">{exchange.body}</pre> : <div className="overflow-auto font-mono text-xs/5"><JsonPreview value={parsed} /></div>
  }
  if (contentType.startsWith('image/')) return <ResponseMedia blob={exchange.blob} type="image" />
  if (contentType.startsWith('audio/')) return <ResponseMedia blob={exchange.blob} type="audio" />
  if (contentType.startsWith('video/')) return <ResponseMedia blob={exchange.blob} type="video" />
  if (contentType.includes('html')) return <iframe srcDoc={exchange.body} sandbox="" title="Response preview" className="h-96 w-full border-0 bg-white" />
  if (contentType.startsWith('text/') || contentType.includes('xml') || contentType.includes('yaml')) return <pre className="whitespace-pre-wrap wrap-break-word font-mono text-xs/5">{exchange.body}</pre>
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
          <tbody>{headers.map(([name, value], index) => <tr key={`${name}:${index}`} className="border-t border-(--clarify-code-border) hover:bg-(--clarify-code-control-background)"><td className="break-all border-r border-(--clarify-code-border) px-3 py-2 align-top text-sky-300">{name}</td><td className="break-all px-3 py-2 align-top text-(--clarify-code-text)">{value}</td><td className="pr-1"><CopyButton value={`${name}: ${value}`} /></td></tr>)}</tbody>
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
  const [bodyMode, setBodyMode] = useState<BodyMode>('preview')

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
    <section className="flex min-h-96 min-w-0 flex-col bg-(--clarify-code-background) text-(--clarify-code-text)" aria-label={t('openapi.response')}>
      <div className="flex min-h-12 flex-wrap items-center gap-2 border-b border-(--clarify-code-border) px-4">
        <span className="mr-auto text-xs font-semibold text-(--clarify-code-muted)">{t('openapi.response')}</span>
        {exchange ? <><span className="text-xs font-semibold text-(--clarify-code-muted)">{exchange.duration} ms</span><span className="text-xs text-(--clarify-code-faint)">{formatBytes(exchange.size)}</span><span className={clsx('size-2 rounded-full', exchange.status < 400 ? 'bg-emerald-400' : 'bg-red-400')} /><span className={clsx('text-sm font-bold', exchange.status < 400 ? 'text-emerald-300' : 'text-red-300')}>{exchange.status} {exchange.statusText}</span></> : null}
      </div>
      {error ? <div className="m-4 rounded-md border border-red-400/20 bg-red-400/10 p-3 text-xs/5 text-red-200">{error}</div> : null}
      {!error && !exchange ? <div className="grid min-h-72 flex-1 place-items-center text-center text-xs text-(--clarify-code-faint)">{t('openapi.responseEmpty')}</div> : null}
      {exchange ? <div className="min-h-0 flex-1 overflow-auto">
        <details className="group border-b border-(--clarify-code-border)"><summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 px-4 text-xs font-semibold text-(--clarify-code-muted) hover:bg-(--clarify-code-control-background)"><ChevronDownIcon className="size-3.5 -rotate-90 group-open:rotate-0" /><span>{t('openapi.cookies')}</span><span className="rounded bg-(--clarify-code-control-background-hover) px-1.5 py-0.5 text-2xs">0</span></summary><div className="border-t border-(--clarify-code-border)"><HiddenCookies /></div></details>
        <details className="group border-b border-(--clarify-code-border)"><summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 px-4 text-xs font-semibold text-(--clarify-code-muted) hover:bg-(--clarify-code-control-background)"><ChevronDownIcon className="size-3.5 -rotate-90 group-open:rotate-0" /><span>{t('openapi.requestHeaders')}</span><span className="rounded bg-(--clarify-code-control-background-hover) px-1.5 py-0.5 text-2xs">{exchange.request.headers.length}</span></summary><div className="border-t border-(--clarify-code-border)"><ResponseHeaders headers={exchange.request.headers} /></div></details>
        <details className="group border-b border-(--clarify-code-border)"><summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 px-4 text-xs font-semibold text-(--clarify-code-muted) hover:bg-(--clarify-code-control-background)"><ChevronDownIcon className="size-3.5 -rotate-90 group-open:rotate-0" /><span>{t('openapi.responseHeaders')}</span><span className="rounded bg-(--clarify-code-control-background-hover) px-1.5 py-0.5 text-2xs">{exchange.headers.length}</span></summary><div className="border-t border-(--clarify-code-border)"><ResponseHeaders headers={exchange.headers} /></div></details>
        <details open className="group"><summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 border-b border-(--clarify-code-border) px-4 text-xs font-semibold text-(--clarify-code-muted) hover:bg-(--clarify-code-control-background)"><ChevronDownIcon className="size-3.5 -rotate-90 group-open:rotate-0" /><span className="mr-auto">{t('openapi.body')}</span><span className="font-mono text-2xs text-(--clarify-code-faint)">{exchange.contentType || t('openapi.unknownContentType')}</span></summary><div className="min-h-72"><div className="flex h-10 items-center justify-between border-b border-(--clarify-code-border) px-3"><div role="tablist" className="flex rounded-md bg-(--clarify-code-control-background) p-0.5">{(['preview', 'raw'] as BodyMode[]).map((mode) => <button key={mode} type="button" role="tab" aria-selected={bodyMode === mode} onClick={() => setBodyMode(mode)} className={clsx('rounded px-2.5 py-1 text-2xs font-semibold', bodyMode === mode ? 'bg-(--clarify-code-control-background-hover) text-(--clarify-code-text)' : 'text-(--clarify-code-muted)')}>{mode === 'preview' ? t('openapi.preview') : t('openapi.raw')}</button>)}</div><div className="flex"><CopyButton value={exchange.body} /><button type="button" onClick={downloadBody} aria-label={t('openapi.downloadBody')} title={t('openapi.downloadBody')} className="grid size-8 place-items-center rounded-md text-(--clarify-code-muted) hover:bg-(--clarify-code-control-background-hover) hover:text-(--clarify-code-text)"><DownloadIcon className="size-4" aria-hidden="true" /></button></div></div><div className="p-4">{bodyMode === 'preview' ? <ResponsePreview exchange={exchange} /> : exchange.size ? <pre className="max-h-128 overflow-auto whitespace-pre-wrap wrap-break-word font-mono text-xs/5">{exchange.body}</pre> : <div className="py-8 text-center text-xs text-(--clarify-code-faint)">{t('openapi.responseBodyEmpty')}</div>}</div></div></details>
      </div> : null}
    </section>
  )
}
