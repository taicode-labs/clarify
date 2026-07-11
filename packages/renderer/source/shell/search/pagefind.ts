import { prefixHref } from '../../utils/href'

import type { Pagefind } from './types'

type PagefindModule = {
  createInstance: () => Pagefind
}

const pagefindPromises = new Map<string, Promise<Pagefind | null>>()

export function pagefindCacheKey(routePrefix: string, locale: string | undefined) {
  return `${routePrefix || '/'}:${locale || 'default'}`
}

export function loadPagefind(routePrefix: string, locale: string | undefined): Promise<Pagefind | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)

  const language = locale ?? document.documentElement.lang
  const cacheKey = pagefindCacheKey(routePrefix, language)
  const cachedPagefind = pagefindPromises.get(cacheKey)
  if (cachedPagefind) {
    return cachedPagefind
  }

  const pagefindUrl = prefixHref('/pagefind/pagefind.js', routePrefix)
  const pagefindPromise = import(/* @vite-ignore */ pagefindUrl)
    .then(async (module: PagefindModule) => {
      const previousLanguage = document.documentElement.lang
      if (language) document.documentElement.lang = language
      const pagefind = module.createInstance()
      if (previousLanguage && previousLanguage !== language) document.documentElement.lang = previousLanguage
      await pagefind.init?.()
      return pagefind
    })
    .catch((error: unknown) => {
      pagefindPromises.delete(cacheKey)
      console.warn('[clarify:search] Pagefind instance failed', { cacheKey, language, error })
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
