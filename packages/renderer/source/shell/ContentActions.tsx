import { Check, Copy, Link2 } from 'lucide-react'
import { useState } from 'react'

import type { RouteItem } from '../types'

type ContentActionsProps = {
  route?: RouteItem
  routePrefix?: string
}

type CopyState = 'idle' | 'content' | 'link'

function resolveRawContentUrl(rawContentUrl: string, routePrefix: string = '/'): string {
  if (!routePrefix || routePrefix === '/') return rawContentUrl
  return `/${routePrefix.replace(/^\/+|\/+$/g, '')}${rawContentUrl}`
}

function getAbsoluteUrl(path: string): string {
  if (typeof window === 'undefined') return path
  return new URL(path, window.location.href).href
}

async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}

export function ContentActions(arg0: ContentActionsProps) {
  const { route, routePrefix } = arg0
  const [copied, setCopied] = useState<CopyState>('idle')

  if (!route?.rawContentUrl) return null

  const rawContentUrl = resolveRawContentUrl(route.rawContentUrl, routePrefix)
  const isOpenApi = route.kind === 'openapi'
  const contentLabel = isOpenApi ? '复制 OpenAPI 内容' : '复制 Markdown 内容'
  const linkLabel = isOpenApi ? '复制 OpenAPI 链接' : '复制 Markdown 链接'

  async function handleCopyContent() {
    const response = await fetch(rawContentUrl)
    const text = await response.text()
    await copyText(text)
    setCopied('content')
    window.setTimeout(() => setCopied('idle'), 1600)
  }

  async function handleCopyLink() {
    await copyText(getAbsoluteUrl(rawContentUrl))
    setCopied('link')
    window.setTimeout(() => setCopied('idle'), 1600)
  }

  return (
    <div className="sticky top-4 z-20 flex justify-end pt-4">
      <div className="inline-flex rounded-full border border-zinc-900/10 bg-white/90 p-1 text-xs font-medium shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/90">
        <button
          type="button"
          onClick={handleCopyContent}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          {copied === 'content' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied === 'content' ? '已复制' : contentLabel}
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          {copied === 'link' ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
          {copied === 'link' ? '已复制' : linkLabel}
        </button>
      </div>
    </div>
  )
}
