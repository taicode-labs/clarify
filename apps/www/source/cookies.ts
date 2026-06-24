type CookieOptions = { domain?: string }
type WritableCookieOptions = CookieOptions & { maxAge: number }

const cookiePath = '/'

export const localeCookieName = 'clarify-locale'
export const themeCookieName = 'clarify-theme'
export const cookieMaxAge = 60 * 60 * 24 * 365

export function readCookieValue(cookieName: string): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie ? document.cookie.split('; ') : []

  for (const cookie of cookies) {
    const separatorIndex = cookie.indexOf('=')
    const name = separatorIndex === -1 ? cookie : cookie.slice(0, separatorIndex)

    if (decodeURIComponent(name) !== cookieName) continue

    return separatorIndex === -1 ? '' : decodeURIComponent(cookie.slice(separatorIndex + 1))
  }

  return null
}

export function deleteCookie(name: string, options: CookieOptions = {}): void {
  writeCookie(name, '', { domain: options.domain, maxAge: 0 })
}

export function writeCookie(name: string, value: string, options: WritableCookieOptions): void {
  if (typeof document === 'undefined') return

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

export function resolveSharedCookieDomains(hostname = typeof window !== 'undefined' ? window.location.hostname : ''): string[] {
  const normalizedHostname = hostname.toLowerCase().replace(/\.$/, '')

  if (!normalizedHostname || normalizedHostname === 'localhost' || normalizedHostname.endsWith('.localhost') || isIpAddress(normalizedHostname)) {
    return []
  }

  const parts = normalizedHostname.split('.')

  if (parts.length < 2) return []

  const domains: string[] = []

  for (let index = parts.length - 2; index >= 0; index -= 1) {
    domains.push(parts.slice(index).join('.'))
  }

  return domains
}

export function resolveWritableSharedCookieDomain(domains: string[], probePrefix = 'clarify-cookie'): string | null {
  for (const domain of domains) {
    const probeName = `${probePrefix}-probe-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const probeValue = '1'

    writeCookie(probeName, probeValue, { domain, maxAge: 60 })

    const isWritable = readCookieValue(probeName) === probeValue
    deleteCookie(probeName, { domain })

    if (isWritable) return domain
  }

  return null
}

export function storeSharedCookie(name: string, value: string, maxAge = cookieMaxAge): void {
  if (typeof document === 'undefined') return

  const domains = resolveSharedCookieDomains()
  const domain = resolveWritableSharedCookieDomain(domains, name)

  deleteCookie(name)

  for (const candidateDomain of domains) {
    deleteCookie(name, { domain: candidateDomain })
  }

  writeCookie(name, value, { domain: domain ?? undefined, maxAge })
}

function isIpAddress(hostname: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':')
}
