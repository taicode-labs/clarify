import { useEffect } from 'react'

import clarifyMarkUrl from '../assets/clarify.svg?url'
import { useBuiltInText } from '../core/i18n'

const CLARIFY_TRACKING_URL = 'https://api.clarify.pub/track'
const CLARIFY_CLIENT_ID_KEY = 'clarify.client_id'

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

function trackClarifySiteView(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof window.fetch !== 'function') return

  void window.fetch(CLARIFY_TRACKING_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: getClientId(),
      event_name: 'clarify_site_view',
      params: {
        page_path: getPagePath(),
        page_title: getPageTitle(),
        site_hostname: getSiteHostname(),
        page_language: getPageLanguage(),
      },
    }),
  }).catch(() => {})
}

export function BuiltWithClarify() {
  const t = useBuiltInText()

  useEffect(() => {
    trackClarifySiteView()
  }, [])

  return (
    <div className="clarify-built-with inline-flex items-center gap-1.5">
      <a
        href="https://clarify.pub"
        target="_blank"
        rel="noreferrer"
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
