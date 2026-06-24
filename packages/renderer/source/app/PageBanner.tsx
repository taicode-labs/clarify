import { X } from 'lucide-react'
import type { ComponentType } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useClarifyConfig } from '../core/context'
import type { ClarifyConfig, ClarifyLocalizedText } from '../core/types'
import { isExternalHref, localizeHref } from '../utils/href'

function resolveLocalizedText(text: ClarifyLocalizedText, locale?: string, fallbackLocale?: string): string {
  if (typeof text === 'string') return text
  return (locale ? text[locale] : undefined) ?? (fallbackLocale ? text[fallbackLocale] : undefined) ?? Object.values(text)[0] ?? ''
}

function bannerStorageKey(config: ClarifyConfig, content: string): string {
  return `clarify:banner:dismissed:${config.title}:${content}`
}

type PageBannerLinkProps = {
  href: string
  label: string
  external?: boolean
  config: ClarifyConfig
  locale?: string
}

function PageBannerLink(props: PageBannerLinkProps) {
  const { href, label, external: externalProp, config, locale } = props
  const external = externalProp ?? isExternalHref(href)
  const resolvedHref = external ? href : localizeHref(href, config, locale)
  const className = "clarify-banner-link shrink-0 rounded-full bg-(--clarify-theme-tokens-colors-primary) px-3 py-1 text-xs/5 font-semibold text-white no-underline transition hover:opacity-90"

  if (external) {
    return <a href={resolvedHref} target="_blank" rel="noreferrer" className={className}>{label}</a>
  }

  return <Link to={resolvedHref} className={className}>{label}</Link>
}

export type PageBannerProps = {
  component?: ComponentType
  currentLocale?: string
  onDismiss?: () => void
}

export function PageBanner(props: PageBannerProps) {
  const { component: CustomBanner, currentLocale, onDismiss } = props
  const config = useClarifyConfig()
  const banner = config.banner
  const builtInBanner = banner && typeof banner === 'object' ? banner : undefined
  const content = builtInBanner ? resolveLocalizedText(builtInBanner.content, currentLocale, config.i18n?.defaultLocale) : ''
  const link = builtInBanner?.link
  const linkLabel = link ? resolveLocalizedText(link.label, currentLocale, config.i18n?.defaultLocale) : ''
  const storageKey = useMemo(() => content ? bannerStorageKey(config, content) : '', [config, content])
  const [dismissed, setDismissed] = useState(() => {
    if (!storageKey || !builtInBanner?.dismissible || typeof window === 'undefined') return false
    return window.localStorage.getItem(storageKey) === '1'
  })

  useEffect(() => {
    if (dismissed) onDismiss?.()
  }, [dismissed, onDismiss])

  if (CustomBanner) {
    return (
      <div className="clarify-banner clarify-banner-custom flex min-h-12 items-center border-b border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-background) px-4 text-sm text-(--clarify-theme-tokens-colors-foreground) dark:border-white/10 dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-(--clarify-theme-layout-max-width)">
          <CustomBanner />
        </div>
      </div>
    )
  }

  if (!builtInBanner || !content || dismissed) return null

  return (
    <div className="clarify-banner relative flex min-h-12 items-center border-b border-(--clarify-ui-accent-border) bg-(--clarify-ui-accent-background) px-4 text-sm text-(--clarify-ui-text) dark:border-white/10">
      <div className="mx-auto flex w-full max-w-(--clarify-theme-layout-max-width) items-center justify-center gap-3 pr-8 sm:pr-0">
        <p className="clarify-banner-content m-0 text-center font-medium">{content}</p>
        {link ? <PageBannerLink href={link.href} label={linkLabel} external={link.external} config={config} locale={currentLocale} /> : null}
      </div>
      {builtInBanner.dismissible ? (
        <button
          type="button"
          className="clarify-banner-dismiss absolute right-3 inline-flex size-8 items-center justify-center rounded-full text-(--clarify-ui-text-soft) transition hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-ui-text-strong)"
          aria-label="Dismiss announcement"
          onClick={() => {
            if (storageKey) window.localStorage.setItem(storageKey, '1')
            setDismissed(true)
          }}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
