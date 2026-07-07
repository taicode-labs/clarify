import { Search as SearchIcon } from 'lucide-react'
import { Suspense } from 'react'

import { useBuiltInText } from '../core/i18n'
import type { NavigationNode, RouteItem } from '../core/types'

import { SearchDialog } from './search/SearchDialog'
import { useSearchProps } from './search/useSearchProps'

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
        className="clarify-mobile-search-button clarify-ui-control relative flex size-8 items-center justify-center rounded-(--clarify-theme-tokens-radius-md) transition lg:hidden"
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
