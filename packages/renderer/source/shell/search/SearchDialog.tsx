import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import clsx from 'clsx'
import { SearchX } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useBuiltInText } from '../../i18n'
import type { NavigationNode, RouteItem } from '../../types'

import { buildSearchItems } from './items'
import { loadPagefind, normalizePagefindUrl, pagefindCacheKey } from './pagefind'
import { SearchInput } from './SearchInput'
import { SearchResult } from './SearchResult'
import type { FullTextSearchItem, Pagefind, SearchDisplayItem } from './types'

type SearchDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  routes: RouteItem[]
  navigation: NavigationNode[]
  routePrefix: string
  assetPrefix: string
  currentLocale?: string
  className?: string
  onNavigate?: () => void
}

type PagefindState = {
  key: string
  pagefind: Pagefind | null
  available: boolean
}

type FullTextSearchState = {
  key: string
  results: FullTextSearchItem[] | null
}

type UseSearchDialogLifecycleArgs = {
  open: boolean
  setOpen: (open: boolean) => void
}

function useSearchDialogLifecycle(arg0: UseSearchDialogLifecycleArgs) {
  const { open, setOpen } = arg0
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.search, location.hash, setOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
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
}

type UseSearchDataArgs = {
  query: string
  searchItems: ReturnType<typeof buildSearchItems>
  routePrefix: string
  assetPrefix: string
  currentLocale?: string
}

type SearchDataState = {
  results: SearchDisplayItem[]
  searchInputLoading: boolean
  showNoResults: boolean
}

function useSearchData(arg0: UseSearchDataArgs): SearchDataState {
  const { query, searchItems, routePrefix, assetPrefix, currentLocale } = arg0
  const [fullTextState, setFullTextState] = useState<FullTextSearchState | null>(null)
  const [pagefindState, setPagefindState] = useState<PagefindState | null>(null)

  const quickResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return []
    return searchItems.filter((item) => item.keywords.includes(normalizedQuery)).slice(0, 8).map((item) => ({ ...item, type: 'quick' as const }))
  }, [query, searchItems])

  const pagefindKey = pagefindCacheKey(assetPrefix, currentLocale)
  const activePagefindState = pagefindState?.key === pagefindKey ? pagefindState : null
  const pagefind = activePagefindState?.pagefind ?? null
  const pagefindAvailable = activePagefindState?.available ?? null
  const trimmedQuery = query.trim()
  const fullTextKey = `${pagefindKey}:${trimmedQuery}`
  const fullTextResults = fullTextState?.key === fullTextKey ? fullTextState.results : null
  const results: SearchDisplayItem[] = fullTextResults ?? quickResults
  const searchInputLoading = pagefindAvailable === null || Boolean(trimmedQuery && pagefind && fullTextState?.key !== fullTextKey)
  const showNoResults = Boolean(query.trim()) && results.length === 0 && pagefindAvailable !== null

  useEffect(() => {
    let cancelled = false

    loadPagefind(assetPrefix, currentLocale).then((loadedPagefind) => {
      if (cancelled) return
      setPagefindState({ key: pagefindKey, pagefind: loadedPagefind, available: Boolean(loadedPagefind) })
    })

    return () => {
      cancelled = true
    }
  }, [assetPrefix, currentLocale, pagefindKey])

  useEffect(() => {
    let cancelled = false
    if (!trimmedQuery || !pagefind) return undefined

    Promise.resolve().then(async () => {
      if (cancelled) return

      try {
        const search = await pagefind.search(trimmedQuery, { limit: 8 })
        const data = await Promise.all(search.results.map(async (result) => ({ id: result.id, data: await result.data() })))
        if (cancelled) return
        setFullTextState({
          key: fullTextKey,
          results: data.map(({ id, data }) => ({
            type: 'full-text',
            id,
            title: data.meta.title || data.url,
            url: normalizePagefindUrl(data.url, routePrefix),
            excerpt: data.excerpt,
          })),
        })
      } catch (error: unknown) {
        console.warn('[clarify:search] Pagefind search failed', { currentLocale, query: trimmedQuery, error })
        if (!cancelled) setFullTextState({ key: fullTextKey, results: null })
      }
    })

    return () => {
      cancelled = true
    }
  }, [currentLocale, fullTextKey, pagefind, routePrefix, trimmedQuery])

  return {
    results,
    searchInputLoading,
    showNoResults,
  }
}

export function SearchDialog(arg0: SearchDialogProps) {
  const {
    open,
    setOpen,
    routes,
    navigation,
    routePrefix,
    assetPrefix,
    currentLocale,
    className,
    onNavigate = () => {},
  } = arg0

  const t = useBuiltInText()
  const navigate = useNavigate()
  const inputRef = useRef<React.ElementRef<typeof SearchInput>>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const searchItems = useMemo(() => buildSearchItems(routes, navigation), [navigation, routes])

  useSearchDialogLifecycle({ open, setOpen })
  const { results, searchInputLoading, showNoResults } = useSearchData({ query, searchItems, routePrefix, assetPrefix, currentLocale })

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

  function renderResultsPanel() {
    return (
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
    )
  }

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
            loading={searchInputLoading}
          />
          {renderResultsPanel()}
        </DialogPanel>
      </div>
    </Dialog>
  )
}

export default SearchDialog
