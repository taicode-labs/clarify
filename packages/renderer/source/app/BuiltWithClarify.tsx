import { useEffect } from 'react'

import clarifyMarkUrl from '../assets/clarify.svg?url'
import { useBuiltInText } from '../core/i18n'

const CLARIFY_TRACKING_URL = 'https://api.clarify.pub/track'
const CLARIFY_CLIENT_ID_KEY = 'clarify.client_id'

type BuiltWithClarifyProps = {
  version?: string
}

function getClientId(): string {
  const newClientId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}.${Math.random()}`

  try {
    const clientId = window.localStorage.getItem(CLARIFY_CLIENT_ID_KEY)
    if (clientId) return clientId

    window.localStorage.setItem(CLARIFY_CLIENT_ID_KEY, newClientId)
    return newClientId
  } catch {
    return newClientId
  }
}

function getSiteHostname(): string {
  return window.location.hostname.slice(0, 100)
}

function getPagePath(): string {
  return window.location.pathname.slice(0, 100)
}

function getPageTitle(): string {
  return document.title.slice(0, 100)
}

function getPageLanguage(): string {
  return (document.documentElement.lang || (typeof navigator === 'undefined' ? '' : navigator.language)).slice(0, 100)
}

function getViewportCategory(): string {
  if (window.innerWidth < 768) return 'mobile'
  if (window.innerWidth < 1024) return 'tablet'
  return 'desktop'
}

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone.slice(0, 100)
  } catch {
    return ''
  }
}

function getClarifyVersion(version?: string): string {
  return version?.slice(0, 100) ?? ''
}

function trackClarifySiteView(version?: string): void {
  if (typeof fetch === 'undefined') return
  if (typeof window === 'undefined') return
  if (typeof document === 'undefined') return

  void fetch(CLARIFY_TRACKING_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: getClientId(),
      event_name: 'clarify_site_view',
      params: {
        timezone: getTimezone(),
        page_path: getPagePath(),
        page_title: getPageTitle(),
        site_hostname: getSiteHostname(),
        page_language: getPageLanguage(),
        clarify_version: getClarifyVersion(version),
        viewport_category: getViewportCategory(),
      },
    }),
  }).catch(() => {})
}

export function BuiltWithClarify(props: BuiltWithClarifyProps) {
  const { version } = props
  const t = useBuiltInText()

  useEffect(() => {
    trackClarifySiteView(version)
  }, [version])

  return (
    <div className="clarify-built-with inline-flex items-center gap-1.5">
      <a
        target="_blank"
        rel="noreferrer"
        href="https://clarify.pub"
        aria-label={t('builtWith.label')}
        className="clarify-built-with inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-medium no-underline transition"
      >
        <span>{t('builtWith.prefix')}</span>
        <img src={clarifyMarkUrl} alt="" className="clarify-built-with-logo h-3.5 w-auto flex-none object-contain" />
        <span className="clarify-built-with-brand font-semibold">Clarify</span>
      </a>
    </div>
  )
}
