import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Check, ChevronDown, Copy, Link2 } from 'lucide-react'
import { useState } from 'react'

import type { RouteItem } from '../types'

type ContentActionsProps = {
  route?: RouteItem
  routePrefix?: string
}

type CopyState = 'idle' | 'content' | 'link'
type CopyAction = {
  key: Exclude<CopyState, 'idle'>
  label: string
  icon: typeof Copy
  run: () => Promise<void>
}

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

  function markCopied(state: Exclude<CopyState, 'idle'>) {
    setCopied(state)
    window.setTimeout(() => setCopied('idle'), 1600)
  }

  async function handleCopyContent() {
    const response = await fetch(rawContentUrl)
    const text = await response.text()
    await copyText(text)
    markCopied('content')
  }

  async function handleCopyLink() {
    await copyText(getAbsoluteUrl(rawContentUrl))
    markCopied('link')
  }

  const actions: CopyAction[] = [
    { key: 'content', label: contentLabel, icon: Copy, run: handleCopyContent },
    { key: 'link', label: linkLabel, icon: Link2, run: handleCopyLink },
  ]
  const primaryAction = actions[0]

  return (
    <div className="sticky top-4 z-20 flex justify-end pt-4">
      <Menu as="div" className="relative inline-flex text-xs font-medium">
        <div className="inline-flex overflow-hidden rounded-full border border-zinc-900/10 bg-white/90 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/90">
          <button
            type="button"
            onClick={primaryAction.run}
            className="inline-flex h-8 items-center gap-1.5 px-3 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {copied === primaryAction.key ? <Check className="h-3.5 w-3.5" /> : <primaryAction.icon className="h-3.5 w-3.5" />}
            {copied === primaryAction.key ? '已复制' : '复制页面'}
          </button>
          <MenuButton className="inline-flex h-8 w-8 items-center justify-center border-l border-zinc-900/10 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white" aria-label="选择复制选项">
            <ChevronDown className="h-3.5 w-3.5" />
          </MenuButton>
        </div>
        <MenuItems
          anchor="bottom end"
          className="z-30 mt-2 w-52 origin-top-right rounded-2xl border border-zinc-900/10 bg-white p-1 text-xs shadow-lg ring-1 ring-black/5 transition [--anchor-gap:--spacing(2)] focus:outline-none data-closed:scale-95 data-closed:opacity-0 dark:border-white/10 dark:bg-zinc-900 dark:ring-white/10"
        >
          {actions.map((action) => {
            const Icon = copied === action.key ? Check : action.icon

            return (
              <MenuItem key={action.key}>
                <button
                  type="button"
                  onClick={action.run}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-zinc-600 transition data-focus:bg-zinc-100 data-focus:text-zinc-950 dark:text-zinc-300 dark:data-focus:bg-white/10 dark:data-focus:text-white"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{copied === action.key ? '已复制' : action.label}</span>
                </button>
              </MenuItem>
            )
          })}
        </MenuItems>
      </Menu>
    </div>
  )
}
