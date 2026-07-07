import type { Config } from '../core/types'

export function isExternalHref(href: string): boolean {
  return /^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//')
}

export function hasLocalePrefix(href: string, config: Config): boolean {
  const firstSegment = href.replace(/^\/+/, '').split('/')[0]
  return Boolean(firstSegment && config.i18n?.locales.some((locale) => locale.code === firstSegment))
}

export function localizeHref(href: string, config: Config, locale?: string): string {
  if (!locale || !config.i18n || isExternalHref(href) || href.startsWith('#')) return href
  if (hasLocalePrefix(href, config)) return href
  if (locale === config.i18n.defaultLocale) return href.startsWith('/') ? href : `/${href}`

  const cleanHref = href === '/' ? '' : href.replace(/^\/+/, '')
  return `/${locale}${cleanHref ? `/${cleanHref}` : ''}`
}

export function prefixHref(href: string, routePrefix: string = '/'): string {
  if (isExternalHref(href) || href.startsWith('#')) return href
  if (!routePrefix || routePrefix === '/') return href.startsWith('/') ? href : `/${href}`

  const prefix = routePrefix.replace(/^\/+|\/+$/g, '')
  const path = href.replace(/^\/+/, '')
  if (!path) return `/${prefix}`
  if (path === prefix || path.startsWith(`${prefix}/`)) return `/${path}`
  return `/${prefix}/${path}`
}
