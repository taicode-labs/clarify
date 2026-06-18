import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'

import { SectionProvider, type Section } from '../components/SectionProvider'
import { ContentActions, Header, Navigation } from '../shell'
import type { RouteItem, ClarifyConfig, NavigationNode, NavigationTab, NavigationTree, TabbedNavigation } from '../types'

export type AppShellProps = {
  config: ClarifyConfig
  routes: RouteItem[]
  navigation: NavigationTree
}

function routeForPath(routes: RouteItem[], pathname: string): RouteItem | undefined {
  return routes.find((route) => route.path === pathname || `/${route.path}` === pathname)
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

function scrollToHash(hash: string) {
  if (!hash) return

  const targetId = decodeURIComponent(hash.slice(1))
  window.requestAnimationFrame(() => {
    document.getElementById(targetId)?.scrollIntoView()
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
  return nodes.some((node) => node.path === pathname || hasPath(node.children ?? [], pathname))
}

type NavigationState = {
  items: NavigationNode[]
  tabs?: NavigationTab[]
}

function navigationFromTabs(navigation: TabbedNavigation, pathname: string): NavigationState {
  const currentTab = navigation.tabs.find((tab) => tab.path === pathname || hasPath(tab.children, pathname))
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

export function AppShell(arg0: AppShellProps) {
  const { config, routes, navigation } = arg0
  const location = useLocation()
  const currentRoute = routeForPath(routes, location.pathname)
  const currentLocale = localeForPath(config, location.pathname, currentRoute)
  const currentLocaleConfig = config.i18n?.locales.find((locale) => locale.code === currentLocale)
  const currentNavigation = navigationForLocale(navigation, currentLocale, location.pathname)
  const sections = sectionsForRoute(currentRoute)
  const hasTabs = Boolean(currentNavigation.tabs?.length)

  useEffect(() => {
    scrollToHash(location.hash)
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

  return (
    <SectionProvider sections={sections}>
      <div className="clarify-app h-full min-h-screen bg-white dark:bg-zinc-950">
        <Header
          config={config}
          navigation={currentNavigation.items}
          tabs={currentNavigation.tabs}
          routes={routes}
          currentLocale={currentLocale}
          currentRoute={currentRoute}
        />
        <motion.aside
          layoutScroll
          className={clsx(
            'clarify-sidebar hidden lg:fixed lg:bottom-0 lg:left-0 lg:z-30 lg:block lg:w-72 lg:overflow-y-auto lg:border-r lg:border-zinc-900/10 lg:bg-white lg:px-5 lg:pb-8 xl:w-80 lg:dark:border-white/10 lg:dark:bg-zinc-950',
            hasTabs ? 'lg:top-28 lg:pt-6' : 'lg:top-14 lg:pt-6',
          )}
        >
          <Navigation navigation={currentNavigation.items} />
        </motion.aside>
        <div className={clsx('clarify-content relative flex min-h-screen flex-col px-4 sm:px-6 lg:ml-72 lg:px-10 xl:ml-80', hasTabs ? 'pt-14 lg:pt-28' : 'pt-14')}>
          <ContentActions route={currentRoute} routePrefix={config.routePrefix} />
          <main className="clarify-main flex-auto">
            <Routes>
              {routes.map((route) => (
                <Route key={route.path} path={route.path} element={<route.component />} />
              ))}
            </Routes>
          </main>
        </div>
      </div>
    </SectionProvider>
  )
}
