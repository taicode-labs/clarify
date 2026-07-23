import type { Config } from '../types'

export function isExternalHref(href: string): boolean {
  return /^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//')
}

export function hasLocalePrefix(href: string, config: Config): boolean {
  const firstSegment = href.replace(/^\/+/, '').split('/')[0]
  return Boolean(firstSegment && config.locales?.locales.some((locale) => locale.code === firstSegment))
}

export function localizeHref(href: string, config: Config, locale?: string): string {
  if (!locale || !config.locales || isExternalHref(href) || href.startsWith('#')) return href
  if (hasLocalePrefix(href, config)) return href
  if (locale === config.locales.default) return href.startsWith('/') ? href : `/${href}`

  const cleanHref = href === '/' ? '' : href.replace(/^\/+/, '')
  return `/${locale}${cleanHref ? `/${cleanHref}` : ''}`
}

export function resolveHomeHref(config: Config, locale?: string): string {
  const homeUrl = config.homeUrl ?? '/'
  return isExternalHref(homeUrl) ? homeUrl : localizeHref(homeUrl, config, locale)
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

export function resolveAbsoluteSiteHref(href: string, config: Config, fallbackBase?: string): string {
  const path = prefixHref(href, config.routePrefix)
  if (isExternalHref(path)) return path

  const base = config.siteUrl ?? fallbackBase
  if (!base) return path
  return new URL(path, base.endsWith('/') ? base : `${base}/`).href
}
