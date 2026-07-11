export function normalizeRoutePath(path: string): string {
  const [pathname, suffix = ''] = path.split(/([?#].*)/, 2)
  const normalizedPathname = pathname.replace(/^\/+/, '/').replace(/\/+$/, '') || '/'
  return `${normalizedPathname}${suffix}`
}

function stripLocalePathPrefix(path: string, locale?: string): string {
  if (!locale) return normalizeRoutePath(path)
  const [pathname, suffix = ''] = normalizeRoutePath(path).split(/([?#].*)/, 2)
  const localePrefix = `/${locale}`
  if (pathname === localePrefix) return `/${suffix}`.replace(/^\/$/, '/')
  if (!pathname.startsWith(`${localePrefix}/`)) return `${pathname}${suffix}`
  return `${pathname.slice(localePrefix.length) || '/'}${suffix}`
}

export function isSameRoutePath(a: string | undefined, b: string | undefined, locale?: string): boolean {
  if (!a || !b) return false
  const normalizedA = normalizeRoutePath(a)
  const normalizedB = normalizeRoutePath(b)
  return normalizedA === normalizedB || stripLocalePathPrefix(normalizedA, locale) === normalizedB || normalizedA === stripLocalePathPrefix(normalizedB, locale)
}
