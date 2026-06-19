export function normalizeRoutePath(path: string): string {
  const [pathname, suffix = ''] = path.split(/([?#].*)/, 2)
  const normalizedPathname = pathname.replace(/^\/+/, '/').replace(/\/+$/, '') || '/'
  return `${normalizedPathname}${suffix}`
}

export function isSameRoutePath(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false
  return normalizeRoutePath(a) === normalizeRoutePath(b)
}
