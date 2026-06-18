import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import clsx from 'clsx'
import { Fragment, Suspense, forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import type { NavigationNode, RouteItem } from '../types'

type SearchItem = {
  title: string
  pageTitle: string
  sectionTitle?: string
  url: string
  keywords: string
}

function SearchIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.24 3.25"
      />
    </svg>
  )
}

function NoResultsIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.01 12a4.237 4.237 0 0 0 1.24-3c0-.62-.132-1.207-.37-1.738M12.01 12A4.237 4.237 0 0 1 9 13.25c-.635 0-1.237-.14-1.777-.388M12.01 12l3.24 3.25m-3.715-9.661a4.25 4.25 0 0 0-5.975 5.908M4.5 15.5l11-11"
      />
    </svg>
  )
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function HighlightQuery(arg0: { text: string; query: string }) {  const { text, query } = arg0

  if (!query) return text

  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'ig'))

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-transparent text-emerald-500 underline">
            {part}
          </mark>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  )
}

function SearchResult(arg0: { result: SearchItem; query: string; active: boolean; onSelect: () => void }) {  const { result, query, active, onSelect } = arg0

  const id = useId()
  const hierarchy = [result.sectionTitle, result.pageTitle].filter((value): value is string => typeof value === 'string')

  return (
    <li
      id={id}
      className={clsx(
        'clarify-search-result group block cursor-default px-4 py-3 aria-selected:bg-zinc-50 dark:aria-selected:bg-zinc-800/50',
        active && 'bg-zinc-50 dark:bg-zinc-800/50',
      )}
      aria-selected={active}
      onMouseDown={(event) => {
        event.preventDefault()
        onSelect()
      }}
    >
      <div className="text-sm font-medium text-zinc-900 group-aria-selected:text-emerald-500 dark:text-white">
        <HighlightQuery text={result.title} query={query} />
      </div>
      {hierarchy.length > 0 ? (
        <div className="mt-1 truncate text-2xs whitespace-nowrap text-zinc-500">
          {hierarchy.map((item, itemIndex, items) => (
            <Fragment key={`${item}-${itemIndex}`}>
              <HighlightQuery text={item} query={query} />
              <span className={itemIndex === items.length - 1 ? 'sr-only' : 'mx-2 text-zinc-300 dark:text-zinc-700'}>/</span>
            </Fragment>
          ))}
        </div>
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

  return (
    <div className="clarify-search-input group relative flex h-12">
      <SearchIcon className="pointer-events-none absolute top-0 left-3 h-full w-5 stroke-zinc-500" />
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
        placeholder="Find something..."
        className="flex-auto appearance-none bg-transparent pr-4 pl-10 text-zinc-900 outline-hidden placeholder:text-zinc-500 focus:w-full focus:flex-none sm:text-sm dark:text-white [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden"
      />
    </div>
  )
})

function SearchDialog(arg0: {
  open: boolean
  setOpen: (open: boolean) => void
  routes: RouteItem[]
  navigation: NavigationNode[]
  className?: string
  onNavigate?: () => void
}) {  const {
  open,
  setOpen,
  routes,
  navigation,
  className,
  onNavigate = () => {},
} = arg0

  const navigate = useNavigate()
  const location = useLocation()
  const inputRef = useRef<React.ElementRef<typeof SearchInput>>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const searchItems = useMemo(() => buildSearchItems(routes, navigation), [navigation, routes])
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return []
    return searchItems.filter((item) => item.keywords.includes(normalizedQuery)).slice(0, 8)
  }, [query, searchItems])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.search, location.hash, setOpen])

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

  return (
    <Dialog open={open} onClose={closeDialog} className={clsx('clarify-search-dialog fixed inset-0 z-50', className)}>
      <DialogBackdrop
        transition
        className="clarify-search-backdrop fixed inset-0 bg-zinc-400/25 backdrop-blur-xs data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in dark:bg-black/40"
      />

      <div className="fixed inset-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-20 md:py-32 lg:px-8 lg:py-[15vh]">
        <DialogPanel
          transition
          className="clarify-search-panel mx-auto transform-gpu overflow-hidden rounded-lg bg-zinc-50 shadow-xl ring-1 ring-zinc-900/7.5 data-closed:scale-95 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:max-w-xl dark:bg-zinc-900 dark:ring-zinc-800"
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
          <div className="border-t border-zinc-200 bg-white empty:hidden dark:border-zinc-100/5 dark:bg-white/2.5">
            {query && results.length === 0 ? (
              <div className="p-6 text-center">
                <NoResultsIcon className="mx-auto h-5 w-5 stroke-zinc-900 dark:stroke-zinc-600" />
                <p className="mt-2 text-xs text-zinc-700 dark:text-zinc-400">
                  Nothing found for{' '}
                  <strong className="font-semibold wrap-break-word text-zinc-900 dark:text-white">&lsquo;{query}&rsquo;</strong>.
                </p>
              </div>
            ) : null}
            {results.length ? (
              <ul id="clarify-search-results" className="clarify-search-results" role="listbox">
                {results.map((result, resultIndex) => (
                  <SearchResult
                    key={result.url}
                    result={result}
                    query={query}
                    active={resultIndex === activeIndex}
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

export function Search(arg0: { routes: RouteItem[]; navigation: NavigationNode[] }) {  const { routes, navigation } = arg0

  const modifierKey = getModifierKey()
  const { buttonProps, dialogProps } = useSearchProps()

  return (
    <div className="clarify-search hidden lg:block lg:max-w-md lg:flex-auto">
      <button
        type="button"
        className="clarify-search-button hidden h-8 w-full items-center gap-2 rounded-full bg-white pr-3 pl-2 text-sm text-zinc-500 ring-1 ring-zinc-900/10 transition hover:ring-zinc-900/20 lg:flex dark:bg-white/5 dark:text-zinc-400 dark:ring-white/10 dark:ring-inset dark:hover:ring-white/20"
        {...buttonProps}
      >
        <SearchIcon className="h-5 w-5 stroke-current" />
        Find something...
        <kbd className="ml-auto text-2xs text-zinc-400 dark:text-zinc-500">
          <kbd className="font-sans">{modifierKey}</kbd>
          <kbd className="font-sans">K</kbd>
        </kbd>
      </button>
      <Suspense fallback={null}>
        <SearchDialog className="hidden lg:block" routes={routes} navigation={navigation} {...dialogProps} />
      </Suspense>
    </div>
  )
}

export function MobileSearch(arg0: {
  routes: RouteItem[]
  navigation: NavigationNode[]
  onNavigate?: () => void
}) {  const {
  routes,
  navigation,
  onNavigate,
} = arg0

  const { buttonProps, dialogProps } = useSearchProps()

  return (
    <div className="clarify-mobile-search contents lg:hidden">
      <button
        type="button"
        className="clarify-mobile-search-button relative flex size-6 items-center justify-center rounded-md transition hover:bg-zinc-900/5 lg:hidden dark:hover:bg-white/5"
        aria-label="Find something..."
        {...buttonProps}
      >
        <span className="absolute size-12 pointer-fine:hidden" />
        <SearchIcon className="h-5 w-5 stroke-zinc-900 dark:stroke-white" />
      </button>
      <Suspense fallback={null}>
        <SearchDialog className="lg:hidden" routes={routes} navigation={navigation} onNavigate={onNavigate} {...dialogProps} />
      </Suspense>
    </div>
  )
}
