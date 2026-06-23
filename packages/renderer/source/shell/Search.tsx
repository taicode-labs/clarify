import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import clsx from 'clsx'
import { Search as SearchIcon, SearchX } from 'lucide-react'
import { Fragment, Suspense, forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useBuiltInText } from '../i18n'
import type { NavigationNode, RouteItem } from '../types'
import { prefixHref } from '../utils/href'

type SearchItem = {
  title: string
  pageTitle: string
  sectionTitle?: string
  url: string
  keywords: string
}

type PagefindSearchResultData = {
  url: string
  meta: {
    title?: string
  }
  excerpt?: string
}

type PagefindSearchResult = {
  id: string
  data: () => Promise<PagefindSearchResultData>
}

type Pagefind = {
  init?: () => Promise<void>
  search: (query: string, options?: { limit?: number }) => Promise<{ results: PagefindSearchResult[] }>
}

type PagefindModule = {
  createInstance: () => Pagefind
}

type FullTextSearchItem = {
  type: 'full-text'
  id: string
  title: string
  url: string
  excerpt?: string
}

type QuickSearchItem = SearchItem & { type: 'quick' }

type SearchDisplayItem = FullTextSearchItem | QuickSearchItem

const pagefindPromises = new Map<string, Promise<Pagefind | null>>()

function logSearchDebug(message: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  console.info(`[clarify:search] ${message}`, data ?? '')
}

function routeGroupTitles(navigation: NavigationNode[]) {
  const titles = new Map<string, string>()

  for (const node of navigation) {
    if (node.children?.length) {
      for (const child of node.children) {
        titles.set(child.path, node.title)
      }
    } else {
      titles.set(node.path, node.title)
    }
  }

  return titles
}

function buildSearchItems(routes: RouteItem[], navigation: NavigationNode[]): SearchItem[] {
  const groupTitles = routeGroupTitles(navigation)

  return routes.flatMap((route) => {
    const groupTitle = groupTitles.get(route.path)
    const pageItem: SearchItem = {
      title: route.title,
      pageTitle: route.title,
      sectionTitle: groupTitle,
      url: route.path,
      keywords: [groupTitle, route.title, route.path, route.kind].filter(Boolean).join(' ').toLowerCase(),
    }

    const sectionItems =
      route.sections?.map((section) => ({
        title: section.title,
        pageTitle: route.title,
        sectionTitle: groupTitle,
        url: `${route.path}#${section.id}`,
        keywords: [groupTitle, route.title, section.title, route.path, section.id].filter(Boolean).join(' ').toLowerCase(),
      })) ?? []

    return [pageItem, ...sectionItems]
  })
}

function loadPagefind(routePrefix: string, locale: string | undefined): Promise<Pagefind | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)

  const language = locale ?? document.documentElement.lang
  const cacheKey = `${routePrefix || '/'}:${language || 'default'}`
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

function normalizePagefindUrl(url: string, routePrefix: string): string {
  const parsedUrl = new URL(url, window.location.origin)
  let pathname = parsedUrl.pathname
  const prefix = routePrefix && routePrefix !== '/' ? `/${routePrefix.replace(/^\/+|\/+$/g, '')}` : ''

  if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    pathname = pathname.slice(prefix.length) || '/'
  }

  return `${pathname}${parsedUrl.search}${parsedUrl.hash}`
}

function stripHtml(value: string): string {
  if (typeof document === 'undefined') return value.replace(/<[^>]*>/g, '')
  const template = document.createElement('template')
  template.innerHTML = value
  return template.content.textContent ?? ''
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

type HighlightQueryProps = { text: string; query: string }

function HighlightQuery(arg0: HighlightQueryProps) {  const { text, query } = arg0

  if (!query) return text

  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'ig'))

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-transparent text-(--clarify-theme-tokens-colors-primary) underline">
            {part}
          </mark>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  )
}

type SearchResultProps = {
  result: SearchDisplayItem
  query: string
  active: boolean
  onActive: () => void
  onSelect: () => void
}

function SearchResult(arg0: SearchResultProps) {  const { result, query, active, onActive, onSelect } = arg0

  const id = useId()
  const hierarchy = result.type === 'quick'
    ? [result.sectionTitle, result.pageTitle].filter((value): value is string => typeof value === 'string')
    : []

  return (
    <li
      id={id}
      className={clsx(
        'clarify-search-result group block cursor-pointer px-4 py-3',
        active && 'clarify-search-result-active',
      )}
      aria-selected={active}
      onMouseEnter={onActive}
      onMouseMove={onActive}
      onMouseDown={(event) => {
        event.preventDefault()
        onSelect()
      }}
    >
      <div className="clarify-search-result-title">
        <HighlightQuery text={result.title} query={query} />
      </div>
      {hierarchy.length > 0 ? (
        <div className="clarify-search-result-hierarchy mt-1 truncate whitespace-nowrap">
          {hierarchy.map((item, itemIndex, items) => (
            <Fragment key={`${item}-${itemIndex}`}>
              <HighlightQuery text={item} query={query} />
              <span className={itemIndex === items.length - 1 ? 'sr-only' : 'clarify-search-result-separator mx-2'}>/</span>
            </Fragment>
          ))}
        </div>
      ) : null}
      {result.type === 'full-text' && result.excerpt ? (
        <p className="clarify-search-result-excerpt mt-1 line-clamp-2 text-xs leading-5 text-(--clarify-theme-tokens-colors-muted)">
          {stripHtml(result.excerpt)}
        </p>
      ) : null}
    </li>
  )
}

const SearchInput = forwardRef<
  React.ElementRef<'input'>,
  {
    query: string
    setQuery: (query: string) => void
    onClose: () => void
    onSubmit: () => void
    activeDescendantId?: string
  }
>(function SearchInput(arg0, inputRef) {  const { query, setQuery, onClose, onSubmit, activeDescendantId } = arg0
  const t = useBuiltInText()

  return (
    <div className="clarify-search-input group relative flex h-12">
      <SearchIcon className="pointer-events-none absolute top-0 left-3 h-full w-5 stroke-(--clarify-theme-tokens-colors-muted)" />
      <input
        ref={inputRef}
        data-autofocus
        role="combobox"
        aria-expanded={query !== ''}
        aria-controls="clarify-search-results"
        aria-activedescendant={activeDescendantId}
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            if (query) setQuery('')
            else onClose()
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            onSubmit()
          }
        }}
        placeholder={t('search.placeholder')}
        className="clarify-search-field flex-auto appearance-none bg-transparent pr-4 pl-10 outline-hidden focus:w-full focus:flex-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden"
      />
    </div>
  )
})

type SearchDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  routes: RouteItem[]
  navigation: NavigationNode[]
  routePrefix?: string
  currentLocale?: string
  className?: string
  onNavigate?: () => void
}

function SearchDialog(arg0: SearchDialogProps) {  const {
  open,
  setOpen,
  routes,
  navigation,
  routePrefix = '/',
  currentLocale,
  className,
  onNavigate = () => {},
} = arg0

  const t = useBuiltInText()
  const navigate = useNavigate()
  const location = useLocation()
  const inputRef = useRef<React.ElementRef<typeof SearchInput>>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [fullTextResults, setFullTextResults] = useState<FullTextSearchItem[] | null>(null)
  const [pagefind, setPagefind] = useState<Pagefind | null>(null)
  const [pagefindAvailable, setPagefindAvailable] = useState<boolean | null>(null)
  const searchItems = useMemo(() => buildSearchItems(routes, navigation), [navigation, routes])
  const quickResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return []
    return searchItems.filter((item) => item.keywords.includes(normalizedQuery)).slice(0, 8).map((item) => ({ ...item, type: 'quick' as const }))
  }, [query, searchItems])
  const results: SearchDisplayItem[] = fullTextResults ?? quickResults

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.search, location.hash, setOpen])

  useEffect(() => {
    let cancelled = false
    logSearchDebug('locale or route prefix changed; reload Pagefind', { currentLocale, routePrefix, documentLanguage: document.documentElement.lang })
    setPagefind(null)
    setPagefindAvailable(null)

    loadPagefind(routePrefix, currentLocale).then((loadedPagefind) => {
      if (cancelled) {
        logSearchDebug('ignore stale Pagefind load', { currentLocale, routePrefix })
        return
      }
      logSearchDebug('Pagefind load applied', { currentLocale, routePrefix, available: Boolean(loadedPagefind) })
      setPagefind(loadedPagefind)
      setPagefindAvailable(Boolean(loadedPagefind))
    })

    return () => {
      cancelled = true
      logSearchDebug('cancel Pagefind load effect', { currentLocale, routePrefix })
    }
  }, [currentLocale, routePrefix])

  useEffect(() => {
    const trimmedQuery = query.trim()
    let cancelled = false
    setFullTextResults(null)
    if (!trimmedQuery || !pagefind) return undefined

    Promise.resolve().then(async () => {
      if (cancelled) return

      try {
        logSearchDebug('run Pagefind search', { currentLocale, query: trimmedQuery, routePrefix })
        const search = await pagefind.search(trimmedQuery, { limit: 8 })
        const data = await Promise.all(search.results.map(async (result) => ({ id: result.id, data: await result.data() })))
        if (cancelled) return
        logSearchDebug('Pagefind search results', { currentLocale, query: trimmedQuery, count: data.length })
        setFullTextResults(data.map(({ id, data }) => ({
          type: 'full-text',
          id,
          title: data.meta.title || data.url,
          url: normalizePagefindUrl(data.url, routePrefix),
          excerpt: data.excerpt,
        })))
      } catch (error: unknown) {
        console.warn('[clarify:search] Pagefind search failed', { currentLocale, query: trimmedQuery, error })
        if (!cancelled) {
          setFullTextResults(null)
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [pagefind, query, routePrefix])

  useEffect(() => {
    if (open) return undefined

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, setOpen])

  const updateQuery = (value: string) => {
    setQuery(value)
    setActiveIndex(0)
  }

  function closeDialog() {
    updateQuery('')
    setOpen(false)
  }

  function selectResult(result = results[activeIndex]) {
    if (!result) return
    navigate(result.url)
    onNavigate()
    closeDialog()
  }

  const showNoResults = query && results.length === 0 && pagefindAvailable !== null

  return (
    <Dialog open={open} onClose={closeDialog} className={clsx('clarify-search-dialog fixed inset-0 z-50', className)}>
      <DialogBackdrop
        transition
        className="clarify-search-backdrop clarify-ui-backdrop fixed inset-0 backdrop-blur-xs data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-20 md:py-32 lg:px-8 lg:py-(--clarify-search-dialog-padding-block-lg)">
        <DialogPanel
          transition
          className="clarify-search-panel mx-auto transform-gpu overflow-hidden rounded-(--clarify-theme-tokens-radius-lg) bg-(--clarify-theme-tokens-colors-surface) shadow-xl ring-1 ring-(--clarify-theme-tokens-colors-border) data-closed:scale-95 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:max-w-xl dark:bg-zinc-900 dark:ring-zinc-800"
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setActiveIndex((index) => (results.length ? (index + 1) % results.length : 0))
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActiveIndex((index) => (results.length ? (index - 1 + results.length) % results.length : 0))
            }
          }}
        >
          <SearchInput
            ref={inputRef}
            query={query}
            setQuery={updateQuery}
            onClose={closeDialog}
            onSubmit={() => selectResult()}
          />
          <div className="border-t border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-background) empty:hidden dark:border-zinc-100/5 dark:bg-white/2.5">
            {showNoResults ? (
              <div className="p-6 text-center">
                <SearchX className="mx-auto h-5 w-5 stroke-(--clarify-theme-tokens-colors-foreground) dark:stroke-zinc-600" />
                <p className="mt-2 text-xs text-(--clarify-theme-tokens-colors-muted) dark:text-zinc-400">
                  {t('search.noResults', { query })}
                </p>
              </div>
            ) : null}
            {results.length ? (
              <ul id="clarify-search-results" className="clarify-search-results" role="listbox">
                {results.map((result, resultIndex) => (
                  <SearchResult
                    key={result.type === 'full-text' ? result.id : result.url}
                    result={result}
                    query={query}
                    active={resultIndex === activeIndex}
                    onActive={() => setActiveIndex(resultIndex)}
                    onSelect={() => selectResult(result)}
                  />
                ))}
              </ul>
            ) : null}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

function useSearchProps() {
  const buttonRef = useRef<React.ElementRef<'button'>>(null)
  const [open, setOpen] = useState(false)

  return {
    buttonProps: {
      ref: buttonRef,
      onClick() {
        setOpen(true)
      },
    },
    dialogProps: {
      open,
      setOpen,
    },
  }
}

function getModifierKey() {
  if (typeof navigator === 'undefined') return 'Ctrl '
  return /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? '⌘' : 'Ctrl '
}

export type SearchProps = { routes: RouteItem[]; navigation: NavigationNode[]; routePrefix?: string; currentLocale?: string }

export function Search(arg0: SearchProps) {  const { routes, navigation, routePrefix, currentLocale } = arg0

  const t = useBuiltInText()
  const modifierKey = getModifierKey()
  const { buttonProps, dialogProps } = useSearchProps()

  return (
    <div className="clarify-search hidden w-80 max-w-(--clarify-search-max-width) lg:block">
      <button
        type="button"
        className="clarify-search-button hidden h-9 w-full items-center gap-2 rounded-(--clarify-theme-tokens-radius-lg) bg-(--clarify-theme-tokens-colors-surface) pr-3 pl-2.5 font-medium ring-1 ring-(--clarify-theme-tokens-colors-border) transition hover:bg-(--clarify-theme-tokens-colors-background) lg:flex dark:bg-white/5 dark:ring-white/10 dark:ring-inset dark:hover:bg-white/10"
        {...buttonProps}
      >
        <SearchIcon className="h-5 w-5 stroke-current" />
        {t('search.button')}
        <kbd className="clarify-search-shortcut ml-auto rounded-(--clarify-theme-tokens-radius-sm) bg-(--clarify-theme-tokens-colors-background) px-1.5 py-0.5 ring-1 ring-(--clarify-theme-tokens-colors-border) dark:bg-white/5 dark:ring-white/10">
          <kbd className="font-sans">{modifierKey}</kbd>
          <kbd className="font-sans">K</kbd>
        </kbd>
      </button>
      <Suspense fallback={null}>
        <SearchDialog className="hidden lg:block" routes={routes} navigation={navigation} routePrefix={routePrefix} currentLocale={currentLocale} {...dialogProps} />
      </Suspense>
    </div>
  )
}

export type MobileSearchProps = {
  routes: RouteItem[]
  navigation: NavigationNode[]
  routePrefix?: string
  currentLocale?: string
  onNavigate?: () => void
}

export function MobileSearch(arg0: MobileSearchProps) {  const {
  routes,
  navigation,
  routePrefix,
  currentLocale,
  onNavigate,
} = arg0

  const t = useBuiltInText()
  const { buttonProps, dialogProps } = useSearchProps()

  return (
    <div className="clarify-mobile-search contents lg:hidden">
      <button
        type="button"
        className="clarify-mobile-search-button clarify-ui-control relative flex size-6 items-center justify-center rounded-(--clarify-theme-tokens-radius-md) transition lg:hidden"
        aria-label={t('search.placeholder')}
        {...buttonProps}
      >
        <span className="absolute size-12 pointer-fine:hidden" />
        <SearchIcon className="h-5 w-5 stroke-(--clarify-theme-tokens-colors-foreground) dark:stroke-white" />
      </button>
      <Suspense fallback={null}>
        <SearchDialog className="lg:hidden" routes={routes} navigation={navigation} routePrefix={routePrefix} currentLocale={currentLocale} onNavigate={onNavigate} {...dialogProps} />
      </Suspense>
    </div>
  )
}
