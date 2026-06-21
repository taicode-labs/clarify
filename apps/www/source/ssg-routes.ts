export const routes = ['/', '/pricing/', '/about/', '/privacy-policy/', '/404.html'] as const

export type AppRoute = (typeof routes)[number]

export function normalizePath(path: string): AppRoute {
  if (path === '/404.html') {
    return '/404.html'
  }

  const normalizedPath = path.endsWith('/') ? path : `${path}/`

  return routes.includes(normalizedPath as AppRoute) ? (normalizedPath as AppRoute) : '/404.html'
}

export function getClientPath(): string {
  return typeof window !== 'undefined' ? window.location.pathname : '/'
}

export function resolveAppRoute(path?: string): AppRoute {
  return normalizePath(path ?? getClientPath())
}
