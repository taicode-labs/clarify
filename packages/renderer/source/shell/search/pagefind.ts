import { prefixHref } from '../../utils/href'
import type { Pagefind } from './types'

type PagefindModule = {
  createInstance: () => Pagefind
}

const pagefindPromises = new Map<string, Promise<Pagefind | null>>()

export function pagefindCacheKey(routePrefix: string, locale: string | undefined) {
  return `${routePrefix || '/'}:${locale || 'default'}`
}

export function logSearchDebug(message: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  console.info(`[clarify:search] ${message}`, data ?? '')
}

export function loadPagefind(routePrefix: string, locale: string | undefined): Promise<Pagefind | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)

  const language = locale ?? document.documentElement.lang
  const cacheKey = pagefindCacheKey(routePrefix, language)
  const cachedPagefind = pagefindPromises.get(cacheKey)
  if (cachedPagefind) {
    logSearchDebug('reuse Pagefind instance promise', { cacheKey, language, routePrefix })
    return cachedPagefind
  }

  const pagefindUrl = prefixHref('/pagefind/pagefind.js', routePrefix)
  logSearchDebug('create Pagefind instance promise', { cacheKey, language, pagefindUrl, routePrefix })
  const pagefindPromise = import(/* @vite-ignore */ pagefindUrl)
    .then(async (module: PagefindModule) => {
      const previousLanguage = document.documentElement.lang
      if (language) document.documentElement.lang = language
      logSearchDebug('create Pagefind instance', { cacheKey, detectedLanguage: document.documentElement.lang, previousLanguage })
      const pagefind = module.createInstance()
      if (previousLanguage && previousLanguage !== language) document.documentElement.lang = previousLanguage
      await pagefind.init?.()
      logSearchDebug('Pagefind instance ready', { cacheKey, language })
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
  const parsedUrl = new URL(url, window.location.origin)
  let pathname = parsedUrl.pathname
  const prefix = routePrefix && routePrefix !== '/' ? `/${routePrefix.replace(/^\/+|\/+$/g, '')}` : ''

  if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    pathname = pathname.slice(prefix.length) || '/'
  }

  return `${pathname}${parsedUrl.search}${parsedUrl.hash}`
}
