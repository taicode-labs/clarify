import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Link, Routes, Route, useLocation } from 'react-router-dom'

import { SectionProvider, type Section } from '../components/SectionProvider'
import { SiteLogo } from '../components/SiteLogo'
import { ContentActions, Header, Navigation } from '../shell'
import type { RouteItem, ClarifyConfig, NavigationNode, NavigationTree } from '../types'

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

function navigationForLocale(navigation: NavigationTree, locale?: string): NavigationNode[] {
  if (Array.isArray(navigation)) return navigation
  if (!locale) return []
  return navigation[locale] ?? []
}

function homePathForLocale(config: ClarifyConfig, locale?: string): string {
  if (!locale || !config.i18n || locale === config.i18n.defaultLocale) return '/'
  return `/${locale}`
}

export function AppShell(arg0: AppShellProps) {
  const { config, routes, navigation } = arg0
  const location = useLocation()
  const currentRoute = routeForPath(routes, location.pathname)
  const currentLocale = localeForPath(config, location.pathname, currentRoute)
  const currentLocaleConfig = config.i18n?.locales.find((locale) => locale.code === currentLocale)
  const currentNavigation = navigationForLocale(navigation, currentLocale)
  const sections = sectionsForRoute(currentRoute)

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
      <div className="clarify-app h-full min-h-screen bg-white lg:ml-72 xl:ml-80 dark:bg-zinc-950">
        <motion.header layoutScroll className="clarify-shell contents lg:pointer-events-none lg:fixed lg:inset-0 lg:z-40 lg:flex">
          <div className="clarify-sidebar contents lg:pointer-events-auto lg:block lg:w-72 lg:overflow-y-auto lg:border-r lg:border-zinc-900/10 lg:bg-white lg:px-6 lg:pt-4 lg:pb-8 xl:w-80 lg:dark:border-white/10 lg:dark:bg-zinc-950">
            <div className="clarify-sidebar-brand hidden lg:flex">
              <Link to={homePathForLocale(config, currentLocale)} aria-label="Home" className="clarify-brand flex items-center gap-2 no-underline">
                <SiteLogo logo={config.logo} className="h-6 w-6" />
                <span className="clarify-brand-title text-sm font-semibold text-zinc-900 dark:text-white">{config.title}</span>
              </Link>
            </div>
            <Header config={config} navigation={currentNavigation} routes={routes} currentLocale={currentLocale} currentRoute={currentRoute} />
            <Navigation navigation={currentNavigation} className="clarify-navigation hidden lg:mt-10 lg:block" />
          </div>
        </motion.header>
        <div className="clarify-content relative flex min-h-screen flex-col px-4 pt-14 sm:px-6 lg:px-8">
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
