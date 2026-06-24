export type ThemePreference = 'light' | 'dark' | 'system'

export const themeCookieName = 'clarify-theme'

const themeCookieMaxAge = 60 * 60 * 24 * 365
const cookiePath = '/'

export function isThemePreference(value: string | null | undefined): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function readThemeCookie(): ThemePreference | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie ? document.cookie.split('; ') : []

  for (const cookie of cookies) {
    const separatorIndex = cookie.indexOf('=')
    const name = separatorIndex === -1 ? cookie : cookie.slice(0, separatorIndex)

    if (decodeURIComponent(name) !== themeCookieName) continue

    const value = separatorIndex === -1 ? '' : decodeURIComponent(cookie.slice(separatorIndex + 1))
    return isThemePreference(value) ? value : null
  }

  return null
}

export function getStoredThemePreference(): ThemePreference {
  return readThemeCookie() ?? 'system'
}

export function storeThemePreference(theme: ThemePreference): void {
  if (typeof document === 'undefined') return

  const domains = resolveSharedCookieDomains()

  if (domains.length === 0) {
    writeCookie(themeCookieName, theme, { maxAge: themeCookieMaxAge })
  } else {
    for (const domain of domains) {
      writeCookie(themeCookieName, theme, { domain, maxAge: themeCookieMaxAge })
    }
  }

}

export function resolveSharedCookieDomains(hostname = typeof window !== 'undefined' ? window.location.hostname : ''): string[] {
  const normalizedHostname = hostname.toLowerCase().replace(/\.$/, '')

  if (!normalizedHostname || normalizedHostname === 'localhost' || normalizedHostname.endsWith('.localhost') || isIpAddress(normalizedHostname)) {
    return []
  }

  const parts = normalizedHostname.split('.')

  if (parts.length < 2) return []

  const domains: string[] = []

  for (let index = 0; index <= parts.length - 2; index += 1) {
    domains.push(parts.slice(index).join('.'))
  }

  return domains
}

function writeCookie(name: string, value: string, options: { domain?: string; maxAge: number }): void {
  const attributes = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Path=${cookiePath}`,
    `Max-Age=${options.maxAge}`,
    'SameSite=Lax',
  ]

  if (options.domain) attributes.push(`Domain=.${options.domain}`)
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') attributes.push('Secure')

  try {
    document.cookie = attributes.join('; ')
  } catch {
    // Ignore cookie write failures from restricted embeds.
  }
}

function isIpAddress(hostname: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':')
}
