import { ArrowRight, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useConfig } from '../core/context'
import type { Config } from '../core/types'
import { isExternalHref, localizeHref } from '../utils/href'
import { resolveLocalizedText } from '../utils/localized-text'

function bannerStorageKey(config: Config, content: string): string {
  return `clarify:banner:dismissed:${config.title}:${content}`
}

type PageBannerLinkProps = {
  href: string
  label: string
  external?: boolean
  config: Config
  locale?: string
}

function PageBannerLink(props: PageBannerLinkProps) {
  const { href, label, external: externalProp, config, locale } = props
  const external = externalProp ?? isExternalHref(href)
  const resolvedHref = external ? href : localizeHref(href, config, locale)
  const className = "clarify-banner-link inline-flex h-7 shrink-0 items-center gap-1 rounded-(--clarify-theme-tokens-radius-md) px-2 text-xs/5 font-semibold text-(--clarify-ui-accent-text) no-underline transition hover:bg-(--clarify-ui-hover-background) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)"
  const children = (
    <>
      <span className="hidden sm:inline">{label}</span>
      <ArrowRight className="size-3.5" aria-hidden="true" />
    </>
  )

  if (external) {
    return <a href={resolvedHref} target="_blank" rel="noreferrer" className={className} aria-label={label} title={label}>{children}</a>
  }

  return <Link to={resolvedHref} className={className} aria-label={label} title={label}>{children}</Link>
}

export type PageBannerProps = {
  currentLocale?: string
  onDismiss?: () => void
}

export function PageBanner(props: PageBannerProps) {
  const { currentLocale, onDismiss } = props
  const config = useConfig()
  const banner = config.banner

  // All hooks must be called unconditionally — before any early return.
  const content = banner ? resolveLocalizedText(banner.content, currentLocale, config.i18n?.defaultLocale) : ''
  const storageKey = useMemo(() => {
    if (!banner || !content) return ''
    return bannerStorageKey(config, content)
  }, [config, content, banner])
  const [dismissed, setDismissed] = useState(() => {
    if (!banner?.dismissible || typeof window === 'undefined') return false
    return window.localStorage.getItem(storageKey) === '1'
  })

  useEffect(() => {
    if (dismissed) onDismiss?.()
  }, [dismissed, onDismiss])

  if (!banner) return null
  if (!content) return null
  if (dismissed) return null

  const link = banner.link
  const linkLabel = link ? resolveLocalizedText(link.label, currentLocale, config.i18n?.defaultLocale) : ''

  return (
    <div className="clarify-banner relative flex h-12 items-center border-b border-(--clarify-ui-accent-border) bg-(--clarify-ui-accent-background) px-4 text-sm text-(--clarify-ui-text) dark:border-white/10">
      <div className="mx-auto flex min-w-0 w-full max-w-(--clarify-theme-layout-max-width) items-center justify-center gap-1 pr-9 sm:gap-2">
        <p className="clarify-banner-content m-0 min-w-0 truncate text-left font-medium sm:text-center">{content}</p>
        {link ? <PageBannerLink href={link.href} label={linkLabel} external={link.external} config={config} locale={currentLocale} /> : null}
      </div>
      {banner.dismissible ? (
        <button
          type="button"
          className="clarify-banner-dismiss absolute right-2 inline-flex size-8 items-center justify-center rounded-(--clarify-theme-tokens-radius-md) text-(--clarify-ui-text-soft) transition hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-ui-text-strong) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary) sm:right-3"
          aria-label="Dismiss announcement"
          onClick={() => {
            if (storageKey && typeof window !== 'undefined') window.localStorage.setItem(storageKey, '1')
            setDismissed(true)
          }}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
