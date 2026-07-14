import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useBuiltInText } from '../core/i18n'
import type { NavigationNode, RouteItem } from '../core/types'
import { isSameRoutePath, normalizeRoutePath } from '../utils/path'

function flattenNavigation(nodes: NavigationNode[]): NavigationNode[] {
  return nodes.flatMap((node) => node.children?.length ? flattenNavigation(node.children) : [node])
}

type PageNavigationProps = { navigation: NavigationNode[]; currentRoute?: RouteItem }

export function PageNavigation(arg0: PageNavigationProps) {
  const { navigation, currentRoute } = arg0
  const t = useBuiltInText()
  if (!currentRoute) return null

  const pageRoutes = flattenNavigation(navigation)
  const currentIndex = pageRoutes.findIndex((route) => isSameRoutePath(route.path, currentRoute.path))
  if (currentIndex === -1) return null

  const previous = pageRoutes[currentIndex - 1]
  const next = pageRoutes[currentIndex + 1]
  if (!previous && !next) return null
  const hasBothDirections = Boolean(previous && next)

  return (
    <nav
      className={clsx(
        'clarify-page-navigation mt-12 grid border-t border-(--clarify-theme-tokens-colors-border)',
        hasBothDirections && '@3xl:grid-cols-2',
      )}
      aria-label={t('navigation.previousNext')}
    >
      {previous ? <PageNavigationLink direction="previous" route={previous} separated={hasBothDirections} /> : null}
      {next ? <PageNavigationLink direction="next" route={next} separated={hasBothDirections} /> : null}
    </nav>
  )
}

type PageNavigationLinkProps = { direction: 'previous' | 'next'; route: NavigationNode; separated: boolean }

function PageNavigationLink(arg0: PageNavigationLinkProps) {
  const { direction, route, separated } = arg0
  const t = useBuiltInText()

  const isNext = direction === 'next'

  return (
    <Link
      to={normalizeRoutePath(route.path)}
      className={clsx(
        'group flex min-w-0 py-5 no-underline outline-none focus-visible:bg-(--clarify-ui-hover-background)',
        !isNext && '@3xl:pr-8',
        isNext && '@3xl:justify-end @3xl:pl-8 @3xl:text-right',
        isNext && separated && 'border-t border-(--clarify-theme-tokens-colors-border) @3xl:border-t-0 @3xl:border-l',
      )}
    >
      <span className={clsx('min-w-0', isNext && 'ml-auto')}>
        <span className={clsx('clarify-page-navigation-label flex items-center gap-1.5 text-xs/5 font-medium text-(--clarify-theme-tokens-colors-muted)', isNext && 'justify-end')}>
          {!isNext ? <ChevronLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" /> : null}
          {isNext ? t('navigation.next') : t('navigation.previous')}
          {isNext ? <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /> : null}
        </span>
        <span className="clarify-page-navigation-title mt-1 block truncate text-base/6 font-semibold text-(--clarify-theme-tokens-colors-foreground) transition-colors group-hover:text-(--clarify-theme-tokens-colors-primary)">{route.title}</span>
      </span>
    </Link>
  )
}
