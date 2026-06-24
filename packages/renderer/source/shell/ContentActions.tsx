import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Check, ChevronDown, Copy, ExternalLink, FileText, Link2, PencilLine } from 'lucide-react'
import { useState } from 'react'

import { useBuiltInText } from '../i18n'
import type { RouteItem } from '../types'
import { copyTextToClipboard } from '../utils/clipboard'
import { prefixHref } from '../utils/href'

type ContentActionsProps = {
  route?: RouteItem
  routePrefix?: string
}

type CopyState = 'idle' | 'content' | 'link' | 'llms'
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

function getAbsoluteUrl(path: string): string {
  if (typeof window === 'undefined') return path
  return new URL(path, window.location.href).href
}

export function ContentActions(arg0: ContentActionsProps) {
  const { route, routePrefix } = arg0
  const t = useBuiltInText()
  const [copied, setCopied] = useState<CopyState>('idle')

  if (!route?.contentArtifactUrl && !route?.sourceUrl) return null

  const contentArtifactUrl = route.contentArtifactUrl ? resolveContentArtifactUrl(route.contentArtifactUrl, routePrefix) : undefined
  const isOpenApi = route.kind === 'openapi'
  const contentTypeLabel = isOpenApi ? 'OpenAPI' : 'Markdown'
  const replacements = { contentType: contentTypeLabel }
  const viewLabel = isOpenApi ? t('contentActions.viewOpenApi') : t('contentActions.viewMarkdown')
  const viewDescription = isOpenApi ? t('contentActions.viewOpenApiDescription') : t('contentActions.viewMarkdownDescription')

  function markCopied(state: Exclude<CopyState, 'idle'>) {
    setCopied(state)
    window.setTimeout(() => setCopied('idle'), 1600)
  }

  async function handleCopyContent() {
    if (!contentArtifactUrl) return
    const response = await fetch(contentArtifactUrl)
    const text = await response.text()
    if (await copyTextToClipboard(text)) markCopied('content')
  }

  const llmsArtifactUrl = resolveContentArtifactUrl('/llms.txt', routePrefix)

  async function handleCopyLink() {
    if (!contentArtifactUrl) return
    if (await copyTextToClipboard(getAbsoluteUrl(contentArtifactUrl))) markCopied('link')
  }

  async function handleCopyLlms() {
    if (await copyTextToClipboard(getAbsoluteUrl(llmsArtifactUrl))) markCopied('llms')
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
  const primaryAction = actions[0]
  const PrimaryIcon = primaryAction && copied === primaryAction.key ? Check : primaryAction?.icon ?? PencilLine

  return (
    <div className="clarify-content-actions not-prose flex shrink-0 justify-start sm:justify-end">
      <Menu as="div" className="clarify-content-actions-menu relative inline-flex min-w-0 text-sm font-medium">
        <div className="clarify-content-actions-group inline-flex min-w-0 overflow-hidden rounded-full border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) shadow-sm shadow-zinc-900/5">
          {primaryAction ? (
            <button
              type="button"
              onClick={primaryAction.run}
              className="clarify-content-actions-primary clarify-ui-control inline-flex h-8 min-w-0 items-center gap-1.5 px-2.5 transition sm:px-3"
            >
              <PrimaryIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{copied === primaryAction.key ? t('actions.copied') : primaryAction.label}</span>
            </button>
          ) : (
            <a
              href={route.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="clarify-content-actions-primary clarify-ui-control inline-flex h-8 min-w-0 items-center gap-1.5 px-2.5 no-underline transition sm:px-3"
            >
              <PrimaryIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{t('contentActions.editPage')}</span>
            </a>
          )}
          <MenuButton className="clarify-content-actions-trigger clarify-ui-control inline-flex h-8 w-8 items-center justify-center border-l border-(--clarify-theme-tokens-colors-border) transition" aria-label={t('contentActions.copyOptions')}>
            <ChevronDown className="h-3.5 w-3.5" />
          </MenuButton>
        </div>
        <MenuItems
          anchor="bottom end"
          className="clarify-content-actions-list clarify-ui-menu z-30 mt-2 w-(--clarify-ui-action-menu-width) origin-top-right rounded-(--clarify-theme-tokens-radius-xl) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-1.5 shadow-xl shadow-zinc-900/5 transition [--anchor-gap:--spacing(2)] focus:outline-none data-closed:scale-95 data-closed:opacity-0"
        >
          {route.sourceUrl ? (
            <MenuItem>
              <a
                href={route.sourceUrl}
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
        </MenuItems>
      </Menu>
    </div>
  )
}
