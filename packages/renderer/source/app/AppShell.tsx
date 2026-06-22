import clsx from 'clsx'
import { Suspense, lazy, useEffect, useMemo } from 'react'
import type { ComponentType } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'

import { ClarifyLocaleContext } from '../context'
import { ContentActions, Header, Navigation } from '../shell'
import type { RouteItem, ClarifyConfig, NavigationNode, NavigationTab, NavigationTree, TabbedNavigation } from '../types'
import { safeDecodeURIComponent } from '../utils/hash'
import { isSameRoutePath, normalizeRoutePath } from '../utils/path'

import { PageFooter } from './PageFooter'
import { PageNavigation } from './PageNavigation'
import { PageSkeleton } from './PageSkeleton'
import { SectionProvider, type Section } from './SectionProvider'

export type AppShellProps = {
  config: ClarifyConfig
  routes: RouteItem[]
  navigation: NavigationTree
}

function routeForPath(routes: RouteItem[], pathname: string): RouteItem | undefined {
  return routes.find((route) => isSameRoutePath(route.path, pathname))
}

function sectionsForRoute(route?: RouteItem): Section[] {
  return (
    route?.sections?.map((section) => ({
      id: section.id,
      title: section.title,
      badge: section.badge,
      tags: section.tags,
    })) ?? []
  )
}

function resolveRouteComponent(route: RouteItem): ComponentType {
  if (route.lazy) return lazy(route.component as () => Promise<{ default: ComponentType }>)
  return route.component as ComponentType
}

function scrollToHash(hash: string) {
  if (!hash) return

  const targetId = safeDecodeURIComponent(hash.slice(1))
  window.requestAnimationFrame(() => {
    document.getElementById(targetId)?.scrollIntoView()
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('scroll'))
    })
  })
}

function localeForPath(config: ClarifyConfig, pathname: string, route?: RouteItem): string | undefined {
  if (route?.locale) return route.locale
  const i18n = config.i18n
  if (!i18n) return undefined
  const firstSegment = pathname.split('/').filter(Boolean)[0]
  return i18n.locales.find((locale) => locale.code === firstSegment)?.code ?? i18n.defaultLocale
}

function isTabbedNavigation(navigation: NavigationTree): navigation is TabbedNavigation {
  return !Array.isArray(navigation) && 'tabs' in navigation
}

function hasPath(nodes: NavigationNode[], pathname: string): boolean {
  return nodes.some((node) => isSameRoutePath(node.path, pathname) || hasPath(node.children ?? [], pathname))
}

type NavigationState = {
  items: NavigationNode[]
  tabs?: NavigationTab[]
}

function navigationFromTabs(navigation: TabbedNavigation, pathname: string): NavigationState {
  const currentTab = navigation.tabs.find((tab) => isSameRoutePath(tab.path, pathname) || hasPath(tab.children, pathname))
  return {
    items: currentTab?.children ?? navigation.tabs[0]?.children ?? [],
    tabs: navigation.tabs,
  }
}

function navigationForLocale(navigation: NavigationTree, locale: string | undefined, pathname: string): NavigationState {
  if (Array.isArray(navigation)) return { items: navigation }
  if (isTabbedNavigation(navigation)) return navigationFromTabs(navigation, pathname)
  if (!locale) return { items: [] }

  const localizedNavigation = navigation[locale]
  if (!localizedNavigation) return { items: [] }
  return Array.isArray(localizedNavigation) ? { items: localizedNavigation } : navigationFromTabs(localizedNavigation, pathname)
}

function pageTitle(config: ClarifyConfig, route?: RouteItem): string {
  const routeTitle = route?.title?.trim()
  if (!routeTitle || routeTitle === config.title) return config.title
  return `${routeTitle} - ${config.title}`
}

function setNamedMeta(name: string, content: string | undefined) {
  const existing = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!content) {
    existing?.remove()
    return
  }

  const meta = existing ?? document.createElement('meta')
  meta.name = name
  meta.content = content
  if (!existing) document.head.appendChild(meta)
}

function applyDocumentMetadata(config: ClarifyConfig, route?: RouteItem) {
  document.title = pageTitle(config, route)
  setNamedMeta('description', route?.description ?? config.description)
  setNamedMeta('keywords', route?.keywords?.join(', '))
}

export function AppShell(arg0: AppShellProps) {
  const { config, routes, navigation } = arg0
  const location = useLocation()
  const pathname = normalizeRoutePath(location.pathname)
  const currentRoute = routeForPath(routes, pathname)
  const currentLocale = localeForPath(config, pathname, currentRoute)
  const currentLocaleConfig = config.i18n?.locales.find((locale) => locale.code === currentLocale)
  const currentNavigation = navigationForLocale(navigation, currentLocale, pathname)
  const sections = useMemo(() => sectionsForRoute(currentRoute), [currentRoute])
  const hasTabs = Boolean(currentNavigation.tabs?.length)
  const renderRoutes = useMemo(
    () => routes.map(route => ({ ...route, component: resolveRouteComponent(route) })),
    [routes],
  )

  useEffect(() => {
    if (location.hash) {
      scrollToHash(location.hash)
      return
    }

    window.scrollTo({ top: 0, left: 0 })
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('scroll'))
    })
  }, [location.hash, location.pathname])

  useEffect(() => {
    if (!currentLocale) return
    document.documentElement.lang = currentLocale
    if (currentLocaleConfig?.dir) {
      document.documentElement.dir = currentLocaleConfig.dir
    } else {
      document.documentElement.removeAttribute('dir')
    }
  }, [currentLocale, currentLocaleConfig?.dir])

  useEffect(() => {
    applyDocumentMetadata(config, currentRoute)
  }, [config, currentRoute])

  return (
    <ClarifyLocaleContext.Provider value={currentLocale}>
      <SectionProvider sections={sections}>
        <Header
          config={config}
          navigation={currentNavigation.items}
          tabs={currentNavigation.tabs}
          routes={routes}
          currentLocale={currentLocale}
          currentRoute={currentRoute}
        />
        <div className="clarify-layout pb-12 mx-auto grid w-full max-w-(--clarify-theme-layout-max-width) grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
          <aside
            className={clsx(
              'clarify-sidebar hidden lg:sticky lg:z-30 lg:block lg:h-[calc(100vh-3.5rem)] lg:self-start lg:overflow-y-auto lg:bg-(--clarify-theme-tokens-colors-background) lg:px-5 lg:pb-8 xl:px-6 lg:dark:bg-zinc-950',
              hasTabs ? 'lg:top-28 lg:h-[calc(100vh-7rem)] lg:pt-6' : 'lg:top-14 lg:pt-6',
            )}
          >
            <Navigation navigation={currentNavigation.items} />
          </aside>
          <div className={clsx('clarify-content @container relative flex min-h-screen min-w-0 flex-col px-4 sm:px-6 lg:px-8 xl:px-10', hasTabs ? 'pt-14 lg:pt-28' : 'pt-14')}>
            <ContentActions hasTabs={hasTabs} route={currentRoute} routePrefix={config.routePrefix} />
            <main className="clarify-main min-w-0 flex-auto">
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  {renderRoutes.map((route) => (
                    <Route key={route.path} path={route.path} element={<route.component />} />
                  ))}
                </Routes>
              </Suspense>
            </main>
            <PageNavigation navigation={currentNavigation.items} currentRoute={currentRoute} />
          </div>
        </div>
        <PageFooter />
      </SectionProvider>
    </ClarifyLocaleContext.Provider>
  )
}
