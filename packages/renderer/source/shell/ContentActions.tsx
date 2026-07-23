import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Check, ChevronDown, Copy, ExternalLink, FileText, Link2, LoaderCircle, PencilLine, Terminal, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useConfig } from '../core/context'
import { useBuiltInText } from '../i18n'
import type { RouteItem } from '../types'
import { copyTextToClipboard } from '../utils/clipboard'
import { prefixHref, resolveAbsoluteSiteHref } from '../utils/href'

type ContentActionsProps = {
  route?: RouteItem
}

type CopyState = 'idle' | 'content' | 'link' | 'llms' | 'mcp'
type CopyPhase = 'idle' | 'copying' | 'copied' | 'failed'
type CopyAction = {
  key: Exclude<CopyState, 'idle'>
  label: string
  description: string
  icon: typeof Copy
  run: () => Promise<void>
  copiedLabel?: string
}

function resolveContentArtifactUrl(contentArtifactUrl: string, routePrefix: string = '/'): string {
  return prefixHref(contentArtifactUrl, routePrefix)
}

export function ContentActions(arg0: ContentActionsProps) {
  const { route } = arg0
  const config = useConfig()
  const routePrefix = config.routePrefix
  const mcpEnabled = config.features.search.enabled && config.features.search.mcp && Boolean(config.siteUrl)
  const t = useBuiltInText()
  const [copied, setCopied] = useState<CopyState>('idle')
  const [copyPhase, setCopyPhase] = useState<CopyPhase>('idle')

  useEffect(() => {
    if (copyPhase !== 'copied' && copyPhase !== 'failed') return undefined
    const timeout = setTimeout(() => {
      setCopied('idle')
      setCopyPhase('idle')
    }, 1600)
    return () => clearTimeout(timeout)
  }, [copyPhase])

  if (!route?.contentArtifactUrl && !route?.sourceEditUrl) return null

  const contentArtifactUrl = route.contentArtifactUrl ? resolveContentArtifactUrl(route.contentArtifactUrl, routePrefix) : undefined
  const isOpenApi = route.kind === 'openapi'
  const contentTypeLabel = isOpenApi ? 'OpenAPI' : 'Markdown'
  const replacements = { contentType: contentTypeLabel }
  const viewLabel = isOpenApi ? t('contentActions.viewOpenApi') : t('contentActions.viewMarkdown')
  const viewDescription = isOpenApi ? t('contentActions.viewOpenApiDescription') : t('contentActions.viewMarkdownDescription')

  async function runCopy(state: Exclude<CopyState, 'idle'>, getText: () => Promise<string> | string) {
    setCopied(state)
    setCopyPhase('copying')
    try {
      const text = await getText()
      setCopyPhase((await copyTextToClipboard(text)) ? 'copied' : 'failed')
    } catch {
      setCopyPhase('failed')
    }
  }

  async function handleCopyContent() {
    if (!contentArtifactUrl) return
    await runCopy('content', async () => {
      const response = await fetch(contentArtifactUrl)
      if (!response.ok) throw new Error(`Failed to fetch content: ${response.status}`)
      return response.text()
    })
  }

  const llmsArtifactUrl = resolveContentArtifactUrl('/llms.txt', routePrefix)

  function getAbsoluteUrl(path: string): string {
    return resolveAbsoluteSiteHref(path, config, typeof window === 'undefined' ? undefined : window.location.href)
  }

  async function handleCopyLink() {
    if (!contentArtifactUrl) return
    await runCopy('link', () => getAbsoluteUrl(contentArtifactUrl))
  }

  async function handleCopyLlms() {
    await runCopy('llms', () => getAbsoluteUrl(llmsArtifactUrl))
  }

  async function handleCopyMcp() {
    await runCopy('mcp', () => {
      const siteUrl = getAbsoluteUrl('/')
      return JSON.stringify(
        {
          mcpServers: {
            clarify: {
              command: 'npx',
              args: ['@clarify-labs/cli', 'mcp', siteUrl],
            },
          },
        },
        null,
        2,
      )
    })
  }

  const actions: CopyAction[] = contentArtifactUrl
    ? [
        {
          key: 'content',
          label: t('contentActions.copyContent'),
          description: t('contentActions.copyContentDescription', replacements),
          icon: Copy,
          run: handleCopyContent,
          copiedLabel: t('contentActions.copiedContent'),
        },
        {
          key: 'link',
          label: t('contentActions.copyLink', replacements),
          description: t('contentActions.copyLinkDescription', replacements),
          icon: Link2,
          run: handleCopyLink,
          copiedLabel: t('contentActions.copiedLink'),
        },
      ]
    : []

  const llmsAction: CopyAction = {
    key: 'llms',
    label: t('contentActions.copyLlms'),
    description: t('contentActions.copyLlmsDescription'),
    icon: FileText,
    run: handleCopyLlms,
    copiedLabel: t('contentActions.copiedLlms'),
  }
  const mcpAction: CopyAction = {
    key: 'mcp',
    label: t('contentActions.mcpConfig'),
    description: t('contentActions.mcpConfigDescription'),
    icon: Terminal,
    run: handleCopyMcp,
    copiedLabel: t('contentActions.copiedMcpConfig'),
  }
  const primaryAction = actions[0]
  const primaryPhase = primaryAction && copied === primaryAction.key ? copyPhase : 'idle'
  const PrimaryIcon = primaryPhase === 'copying' ? LoaderCircle : primaryPhase === 'copied' ? Check : primaryPhase === 'failed' ? X : primaryAction?.icon ?? PencilLine
  const feedbackAction = copied === 'content' ? actions[0] : copied === 'link' ? actions[1] : copied === 'llms' ? llmsAction : copied === 'mcp' ? mcpAction : undefined
  const feedbackLabel = copyPhase === 'copying'
    ? t('actions.copying')
    : copyPhase === 'failed'
      ? t('actions.copyFailed')
      : feedbackAction?.copiedLabel

  return (
    <div className="clarify-content-actions not-prose flex shrink-0 justify-start sm:justify-end">
      <Menu as="div" className="clarify-content-actions-menu relative inline-flex min-w-0 text-sm font-medium">
        <div className="clarify-content-actions-group inline-flex min-w-0 items-center gap-1">
          {primaryAction ? (
            <button
              type="button"
              onClick={primaryAction.run}
              disabled={primaryPhase === 'copying'}
              aria-live="polite"
              className="clarify-content-actions-primary clarify-ui-control inline-flex h-9 min-w-0 items-center gap-2 rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) px-3 shadow-xs shadow-zinc-900/5 transition"
            >
              <PrimaryIcon className={`h-4 w-4 shrink-0 ${primaryPhase === 'copying' ? 'animate-spin' : ''}`} />
              <span className="truncate">{primaryPhase === 'idle' ? primaryAction.label : feedbackLabel}</span>
            </button>
          ) : (
            <a
              href={route.sourceEditUrl}
              target="_blank"
              rel="noreferrer"
              className="clarify-content-actions-primary clarify-ui-control inline-flex h-9 min-w-0 items-center gap-2 rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) px-3 no-underline shadow-xs shadow-zinc-900/5 transition"
            >
              <PrimaryIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{t('contentActions.editPage')}</span>
            </a>
          )}
          <MenuButton className="clarify-content-actions-trigger clarify-ui-control inline-flex size-9 items-center justify-center rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) shadow-xs shadow-zinc-900/5 transition" aria-label={t('contentActions.copyOptions')}>
            <ChevronDown className="h-3.5 w-3.5" />
          </MenuButton>
        </div>
        {feedbackAction && copyPhase !== 'idle' && copied !== primaryAction?.key ? (
          <div
            role="status"
            className="absolute top-full right-0 mt-2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) px-2.5 py-1.5 text-xs shadow-lg shadow-zinc-900/10"
          >
            {copyPhase === 'copying' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : copyPhase === 'copied' ? <Check className="h-3.5 w-3.5 text-(--clarify-theme-tokens-colors-primary)" /> : <X className="h-3.5 w-3.5" />}
            <span>{feedbackLabel}</span>
          </div>
        ) : null}
        <MenuItems
          modal={false}
          anchor="bottom end"
          className="clarify-content-actions-list clarify-ui-menu z-30 mt-2 w-(--clarify-ui-action-menu-width) origin-top-right rounded-(--clarify-theme-tokens-radius-xl) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-1.5 shadow-xl shadow-zinc-900/5 transition [--anchor-gap:--spacing(2)] focus:outline-none data-closed:scale-95 data-closed:opacity-0"
        >
          {route.sourceEditUrl ? (
            <MenuItem>
              <a
                href={route.sourceEditUrl}
                target="_blank"
                rel="noreferrer"
                className="clarify-content-actions-item clarify-ui-menu-item group flex w-full items-center gap-2 rounded-(--clarify-theme-tokens-radius-lg) px-1.5 py-1.5 text-left no-underline transition"
              >
                <span className="clarify-ui-menu-icon flex shrink-0 rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) p-1.5">
                  <PencilLine className="h-4 w-4" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col px-1">
                  <span className="clarify-ui-menu-title flex items-center gap-1">
                    {t('contentActions.editPage')}
                    <ExternalLink className="clarify-ui-menu-icon h-3 w-3" />
                  </span>
                  <span className="clarify-ui-menu-description truncate">{t('contentActions.editPageDescription')}</span>
                </span>
                <Check className="h-3.5 w-3.5 shrink-0 text-(--clarify-theme-tokens-colors-primary) opacity-0" />
              </a>
            </MenuItem>
          ) : null}
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
                  <span className="clarify-ui-menu-icon flex shrink-0 rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) p-1.5">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col px-1">
                    <span className="clarify-ui-menu-title">{isCopied ? t('contentActions.copiedContent') : action.label}</span>
                    <span className="clarify-ui-menu-description truncate">{action.description}</span>
                  </span>
                  <Check className={`h-3.5 w-3.5 shrink-0 text-(--clarify-theme-tokens-colors-primary) transition ${isCopied ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              </MenuItem>
            )
          })}
          {contentArtifactUrl ? (
            <MenuItem>
              <a
                href={contentArtifactUrl}
                target="_blank"
                rel="noreferrer"
                className="clarify-content-actions-item clarify-ui-menu-item group flex w-full items-center gap-2 rounded-(--clarify-theme-tokens-radius-lg) px-1.5 py-1.5 text-left no-underline transition"
              >
                <span className="clarify-ui-menu-icon flex shrink-0 rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) p-1.5">
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
          ) : null}
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
                  <span className="clarify-ui-menu-icon flex shrink-0 rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) p-1.5">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col px-1">
                    <span className="clarify-ui-menu-title">{isCopied ? action.copiedLabel ?? action.label : action.label}</span>
                    <span className="clarify-ui-menu-description truncate">{action.description}</span>
                  </span>
                  <Check className={`h-3.5 w-3.5 shrink-0 text-(--clarify-theme-tokens-colors-primary) transition ${isCopied ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              </MenuItem>
            )
          })}
          <MenuItem key={llmsAction.key}>
            <button
              type="button"
              onClick={llmsAction.run}
              className="clarify-content-actions-item clarify-ui-menu-item group flex w-full items-center gap-2 rounded-(--clarify-theme-tokens-radius-lg) px-1.5 py-1.5 text-left transition"
            >
              <span className="clarify-ui-menu-icon flex shrink-0 rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) p-1.5">
                <FileText className="h-4 w-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col px-1">
                <span className="clarify-ui-menu-title">{copied === llmsAction.key ? llmsAction.copiedLabel ?? llmsAction.label : llmsAction.label}</span>
                <span className="clarify-ui-menu-description truncate">{llmsAction.description}</span>
              </span>
              <Check className={`h-3.5 w-3.5 shrink-0 text-(--clarify-theme-tokens-colors-primary) transition ${copied === llmsAction.key ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          </MenuItem>
          {mcpEnabled ? <MenuItem key={mcpAction.key}>
            <button
              type="button"
              onClick={mcpAction.run}
              className="clarify-content-actions-item clarify-ui-menu-item group flex w-full items-center gap-2 rounded-(--clarify-theme-tokens-radius-lg) px-1.5 py-1.5 text-left transition"
            >
              <span className="clarify-ui-menu-icon flex shrink-0 rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) p-1.5">
                <Terminal className="h-4 w-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col px-1">
                <span className="clarify-ui-menu-title">{copied === mcpAction.key ? mcpAction.copiedLabel ?? mcpAction.label : mcpAction.label}</span>
                <span className="clarify-ui-menu-description truncate">{mcpAction.description}</span>
              </span>
              <Check className={`h-3.5 w-3.5 shrink-0 text-(--clarify-theme-tokens-colors-primary) transition ${copied === mcpAction.key ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          </MenuItem> : null}
        </MenuItems>
      </Menu>
    </div>
  )
}
