import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useBuiltInText } from '../i18n'
import type { NavigationNode, RouteItem } from '../types'

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

function flattenNavigation(nodes: NavigationNode[]): NavigationNode[] {
  return nodes.flatMap((node) => [node, ...flattenNavigation(node.children ?? [])])
}

export function PageNavigation(arg0: { navigation: NavigationNode[]; currentRoute?: RouteItem }) {
  const { navigation, currentRoute } = arg0
  const t = useBuiltInText()
  if (!currentRoute) return null

  const pageRoutes = flattenNavigation(navigation)
  const currentIndex = pageRoutes.findIndex((route) => route.path === currentRoute.path)
  if (currentIndex === -1) return null

  const previous = pageRoutes[currentIndex - 1]
  const next = pageRoutes[currentIndex + 1]
  if (!previous && !next) return null

  return (
    <nav className="clarify-page-navigation mt-6 grid gap-3 @3xl:grid-cols-2" aria-label={t('navigation.previousNext')}>
      <PageNavigationLink direction="previous" route={previous} />
      <PageNavigationLink direction="next" route={next} />
    </nav>
  )
}

function PageNavigationLink(arg0: { direction: 'previous' | 'next'; route?: NavigationNode }) {
  const { direction, route } = arg0
  const t = useBuiltInText()
  if (!route) return <div className="hidden @3xl:block" />

  const isNext = direction === 'next'

  return (
    <Link
      to={normalizePath(route.path)}
      className={clsx(
        'group flex min-w-0 items-center gap-3 rounded-lg border border-(--clarify-theme-tokens-colors-border) px-4 py-3 no-underline transition hover:border-(--clarify-theme-tokens-colors-primary) hover:bg-(--clarify-theme-tokens-colors-surface) dark:border-white/10 dark:hover:border-(--clarify-theme-tokens-colors-primary) dark:hover:bg-white/2.5',
        isNext && '@3xl:justify-end @3xl:text-right',
      )}
    >
      {!isNext ? <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-(--clarify-theme-tokens-colors-muted) transition group-hover:text-(--clarify-theme-tokens-colors-primary)" /> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[0.6875rem] font-medium uppercase tracking-wide text-(--clarify-theme-tokens-colors-muted)">{isNext ? t('navigation.next') : t('navigation.previous')}</span>
        <span className="mt-0.5 block truncate text-[0.8125rem] font-semibold text-(--clarify-theme-tokens-colors-foreground) dark:text-white">{route.title}</span>
      </span>
      {isNext ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-(--clarify-theme-tokens-colors-muted) transition group-hover:text-(--clarify-theme-tokens-colors-primary)" /> : null}
    </Link>
  )
}
