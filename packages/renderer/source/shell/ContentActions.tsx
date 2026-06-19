import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Check, ChevronDown, Copy, ExternalLink, FileText, Link2 } from 'lucide-react'
import { useState } from 'react'

import type { RouteItem } from '../types'

type ContentActionsProps = {
  hasTabs?: boolean
  route?: RouteItem
  routePrefix?: string
}

type CopyState = 'idle' | 'content' | 'link'
type CopyAction = {
  key: Exclude<CopyState, 'idle'>
  label: string
  description: string
  icon: typeof Copy
  run: () => Promise<void>
}

function resolveContentArtifactUrl(contentArtifactUrl: string, routePrefix: string = '/'): string {
  if (!routePrefix || routePrefix === '/') return contentArtifactUrl
  return `/${routePrefix.replace(/^\/+|\/+$/g, '')}${contentArtifactUrl}`
}

function getAbsoluteUrl(path: string): string {
  if (typeof window === 'undefined') return path
  return new URL(path, window.location.href).href
}

async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}

export function ContentActions(arg0: ContentActionsProps) {
  const { hasTabs = false, route, routePrefix } = arg0
  const [copied, setCopied] = useState<CopyState>('idle')

  if (!route?.contentArtifactUrl) return null

  const contentArtifactUrl = resolveContentArtifactUrl(route.contentArtifactUrl, routePrefix)
  const isOpenApi = route.kind === 'openapi'
  const contentTypeLabel = isOpenApi ? 'OpenAPI' : 'Markdown'
  const viewLabel = isOpenApi ? '查看 OpenAPI 原始内容' : '以 Markdown 格式查看'
  const viewDescription = isOpenApi ? '在新标签页打开 API 描述文件' : '以纯文本查看此页面'

  function markCopied(state: Exclude<CopyState, 'idle'>) {
    setCopied(state)
    window.setTimeout(() => setCopied('idle'), 1600)
  }

  async function handleCopyContent() {
    const response = await fetch(contentArtifactUrl)
    const text = await response.text()
    await copyText(text)
    markCopied('content')
  }

  async function handleCopyLink() {
    await copyText(getAbsoluteUrl(contentArtifactUrl))
    markCopied('link')
  }

  const actions: CopyAction[] = [
    {
      key: 'content',
      label: '复制页面',
      description: `将页面以 ${contentTypeLabel} 格式复制给 LLMs`,
      icon: Copy,
      run: handleCopyContent,
    },
    {
      key: 'link',
      label: `复制 ${contentTypeLabel} 链接`,
      description: `复制当前页面的 ${contentTypeLabel} 原始内容链接`,
      icon: Link2,
      run: handleCopyLink,
    },
  ]
  const primaryAction = actions[0]
  const PrimaryIcon = copied === primaryAction.key ? Check : primaryAction.icon

  return (
    <div className={`clarify-content-actions sticky z-20 flex justify-end py-4 ${hasTabs ? 'top-16 lg:top-30' : 'top-16'}`}>
      <Menu as="div" className="clarify-content-actions-menu relative inline-flex text-sm font-medium">
        <div className="clarify-content-actions-group inline-flex overflow-hidden rounded-full border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface)/90 shadow-sm shadow-zinc-900/5 backdrop-blur dark:border-white/10 dark:bg-zinc-900/80 dark:shadow-none">
          <button
            type="button"
            onClick={primaryAction.run}
            className="clarify-content-actions-primary clarify-ui-control inline-flex h-8 items-center gap-1.5 px-3 transition"
          >
            <PrimaryIcon className="h-3.5 w-3.5" />
            {copied === primaryAction.key ? '已复制' : primaryAction.label}
          </button>
          <MenuButton className="clarify-content-actions-trigger clarify-ui-control inline-flex h-8 w-8 items-center justify-center border-l border-(--clarify-theme-tokens-colors-border) transition dark:border-white/10" aria-label="选择复制选项">
            <ChevronDown className="h-3.5 w-3.5" />
          </MenuButton>
        </div>
        <MenuItems
          anchor="bottom end"
          className="clarify-content-actions-list clarify-ui-menu z-30 mt-2 w-(--clarify-ui-action-menu-width) origin-top-right rounded-(--clarify-theme-tokens-radius-xl) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-1.5 shadow-xl shadow-zinc-900/5 transition [--anchor-gap:--spacing(2)] focus:outline-none data-closed:scale-95 data-closed:opacity-0 dark:border-white/10 dark:bg-zinc-900 dark:shadow-none"
        >
          {actions.slice(0, 1).map((action) => {
            const Icon = action.icon
            const isCopied = copied === action.key

            return (
              <MenuItem key={action.key}>
                <button
                  type="button"
                  onClick={action.run}
                  className="clarify-content-actions-item clarify-ui-menu-item group flex w-full items-center gap-2 rounded-(--clarify-theme-tokens-radius-lg) px-1.5 py-1.5 text-left transition"
                >
                  <span className="clarify-ui-menu-icon flex shrink-0 rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) p-1.5 dark:border-white/10">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col px-1">
                    <span className="clarify-ui-menu-title">{isCopied ? '已复制页面' : action.label}</span>
                    <span className="clarify-ui-menu-description truncate">{action.description}</span>
                  </span>
                  <Check className={`h-3.5 w-3.5 shrink-0 text-(--clarify-theme-tokens-colors-primary) transition ${isCopied ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              </MenuItem>
            )
          })}
          <MenuItem>
            <a
              href={contentArtifactUrl}
              target="_blank"
              rel="noreferrer"
              className="clarify-content-actions-item clarify-ui-menu-item group flex w-full items-center gap-2 rounded-(--clarify-theme-tokens-radius-lg) px-1.5 py-1.5 text-left no-underline transition"
            >
              <span className="clarify-ui-menu-icon flex shrink-0 rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) p-1.5 dark:border-white/10">
                <FileText className="h-4 w-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col px-1">
                <span className="clarify-ui-menu-title flex items-center gap-1">
                  {viewLabel}
                  <ExternalLink className="clarify-ui-menu-icon h-3 w-3" />
                </span>
                <span className="clarify-ui-menu-description truncate">{viewDescription}</span>
              </span>
              <Check className="h-3.5 w-3.5 shrink-0 text-(--clarify-theme-tokens-colors-primary) opacity-0" />
            </a>
          </MenuItem>
          {actions.slice(1).map((action) => {
            const Icon = action.icon
            const isCopied = copied === action.key

            return (
              <MenuItem key={action.key}>
                <button
                  type="button"
                  onClick={action.run}
                  className="clarify-content-actions-item clarify-ui-menu-item group flex w-full items-center gap-2 rounded-(--clarify-theme-tokens-radius-lg) px-1.5 py-1.5 text-left transition"
                >
                  <span className="clarify-ui-menu-icon flex shrink-0 rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) p-1.5 dark:border-white/10">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col px-1">
                    <span className="clarify-ui-menu-title">{isCopied ? '已复制链接' : action.label}</span>
                    <span className="clarify-ui-menu-description truncate">{action.description}</span>
                  </span>
                  <Check className={`h-3.5 w-3.5 shrink-0 text-(--clarify-theme-tokens-colors-primary) transition ${isCopied ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              </MenuItem>
            )
          })}
        </MenuItems>
      </Menu>
    </div>
  )
}
