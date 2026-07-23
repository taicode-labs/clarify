import type { Pagefind } from './types'

type PagefindModule = {
  createInstance: () => Pagefind
}

const pagefindPromises = new Map<string, Promise<Pagefind | null>>()

export function pagefindCacheKey(assetPrefix: string, locale: string | undefined) {
  return `${assetPrefix || '/'}:${locale || 'default'}`
}

export function resolvePagefindUrl(assetPrefix: string): string {
  const prefix = assetPrefix || '/'
  return `${prefix.endsWith('/') ? prefix : `${prefix}/`}pagefind/pagefind.js`
}

export function loadPagefind(assetPrefix: string, locale: string | undefined): Promise<Pagefind | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)

  const cacheKey = pagefindCacheKey(assetPrefix, locale)
  const cachedPagefind = pagefindPromises.get(cacheKey)
  if (cachedPagefind) {
    return cachedPagefind
  }

  const pagefindUrl = resolvePagefindUrl(assetPrefix)
  const pagefindPromise = import(/* @vite-ignore */ pagefindUrl)
    .then(async (module: PagefindModule) => {
      const previousLanguage = document.documentElement.lang
      if (locale) document.documentElement.lang = locale
      const pagefind = module.createInstance()
      if (previousLanguage !== locale) document.documentElement.lang = previousLanguage
      try {
        await pagefind.init?.()
      } catch (error) {
        if (error instanceof Error && error.message.includes('No language indexes found')) {
          return null
        }
        throw error
      }
      return pagefind
    })
    .catch((error: unknown) => {
      pagefindPromises.delete(cacheKey)
      console.warn('[clarify:search] Pagefind instance failed', { cacheKey, locale, error })
      return null
    })

  pagefindPromises.set(cacheKey, pagefindPromise)
  return pagefindPromise
}

export function normalizePagefindUrl(url: string, routePrefix: string): string {
  const parsedUrl = new URL(url, typeof window === 'undefined' ? 'http://localhost' : window.location.origin)
  let pathname = parsedUrl.pathname
  const prefix = routePrefix && routePrefix !== '/' ? `/${routePrefix.replace(/^\/+|\/+$/g, '')}` : ''

  if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    pathname = pathname.slice(prefix.length) || '/'
  }

  return `${pathname}${parsedUrl.search}${parsedUrl.hash}`
}
