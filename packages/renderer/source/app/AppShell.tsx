import { lazy, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { ComponentType } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { LocaleContext } from '../context'
import { useConfig } from '../core/context'
import { useBuiltInText } from '../core/i18n'
import { RuntimeSlotsProvider, type RuntimeSlotRegistry } from '../slots'
import { getStoredLocalePreference, storeLocalePreference } from '../theme/cookies'
import type { RouteItem, Config, LocaleConfig, NavigationNode, NavigationTab, NavigationTree } from '../types'
import { resolveLocalizedText } from '../utils/localized-text'
import { isSameRoutePath, normalizeRoutePath } from '../utils/path'

import { AppShellLayout, type AppShellLayoutConfig } from './AppShellLayout'
import { canonicalHeadingUrl, resolveHeadingHash, scrollToHeadingId } from './heading-hash'
import { SectionHashSync } from './SectionHashSync'
import { SectionProvider, type Section } from './SectionProvider'

export type AppShellProps = {
  routes: RouteItem[]
  navigation: NavigationTree
  runtimeSlots?: RuntimeSlotRegistry
}

function routeForPath(routes: RouteItem[], pathname: string): RouteItem | undefined {
  return routes.find((route) => isSameRoutePath(route.path, pathname))
}

function notFoundRouteForPath(routes: RouteItem[], pathname: string, currentLocale?: string): RouteItem | undefined {
  const localePrefix = currentLocale ? `/${currentLocale}` : undefined
  if (localePrefix && pathname.startsWith(`${localePrefix}/`)) {
    return routeForPath(routes, `${localePrefix}/404`)
  }
  return routeForPath(routes, '/404') ?? routes.find(route => isSameRoutePath(route.basePath, '/404'))
}

function sectionsForRoute(route?: RouteItem): Section[] {
  return (
    route?.sections?.map((section) => ({
      id: section.id,
      title: section.title,
      level: section.level,
      badge: section.badge,
      tags: section.tags,
    })) ?? []
  )
}

function resolveRouteComponent(route: RouteItem): ComponentType {
  if (route.lazy) return lazy(route.component as () => Promise<{ default: ComponentType }>)
  return route.component as ComponentType
}

const HASH_SCROLL_SUPPRESSION_MS = 1500

export { scrollToHeadingId }

type ValueRef<T> = {
  current: T
}

type HashNavigationSource = 'native' | 'router'

type HandledHashLocation = {
  key: string
  nativeObserved: boolean
  routerLocationKey?: string
}

export type HashNavigationRefs = {
  hashScrollSuppressedUntilRef: ValueRef<number>
  hashNavigationEpochRef: ValueRef<number>
  lastHandledLocationRef: ValueRef<HandledHashLocation | undefined>
  hashScrollCleanupRef: ValueRef<(() => void) | undefined>
}

type CoordinateHashNavigationArgs = HashNavigationRefs & {
  location: Pick<Location, 'hash' | 'pathname' | 'search'> & { key?: string }
  aliases?: Record<string, string>
  source: HashNavigationSource
}

export function coordinateHashNavigation(arg0: CoordinateHashNavigationArgs): void {
  if (typeof window === 'undefined') return

  const {
    aliases,
    hashNavigationEpochRef,
    hashScrollCleanupRef,
    hashScrollSuppressedUntilRef,
    lastHandledLocationRef,
    location,
    source,
  } = arg0
  const locationKey = `${location.pathname}${location.search}${location.hash}`
  const lastHandledLocation = lastHandledLocationRef.current

  if (lastHandledLocation?.key === locationKey) {
    if (source === 'native') {
      lastHandledLocationRef.current = { ...lastHandledLocation, nativeObserved: true }
      return
    }
    if (lastHandledLocation.routerLocationKey === location.key) {
      if (source === 'router' && location.hash && hashScrollCleanupRef.current === undefined) {
        const resolvedHash = resolveHeadingHash(location.hash, aliases)
        if (resolvedHash) hashScrollCleanupRef.current = scrollToHeadingId(resolvedHash.canonicalId)
      }
      return
    }
    if (lastHandledLocation.nativeObserved && lastHandledLocation.routerLocationKey === undefined) {
      lastHandledLocationRef.current = { ...lastHandledLocation, routerLocationKey: location.key }
      return
    }
  }

  lastHandledLocationRef.current = {
    key: locationKey,
    nativeObserved: source === 'native',
    routerLocationKey: source === 'router' ? location.key : undefined,
  }
  hashNavigationEpochRef.current += 1
  hashScrollCleanupRef.current?.()
  hashScrollCleanupRef.current = undefined

  if (location.hash) {
    hashScrollSuppressedUntilRef.current = Number.POSITIVE_INFINITY
    const resolvedHash = resolveHeadingHash(location.hash, aliases)
    if (!resolvedHash) return

    if (resolvedHash.wasAlias) {
      window.history.replaceState(
        window.history.state,
        '',
        canonicalHeadingUrl(window.location, resolvedHash.canonicalId),
      )
    }
    hashScrollCleanupRef.current = scrollToHeadingId(resolvedHash.canonicalId)
    return
  }

  hashScrollSuppressedUntilRef.current = Date.now() + HASH_SCROLL_SUPPRESSION_MS
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  window.requestAnimationFrame(() => {
    window.dispatchEvent(new Event('scroll'))
  })
}

function routePathFromBrowserPath(pathname: string, routePrefix: string): string {
  const prefixName = routePrefix.replace(/^\/+|\/+$/g, '')
  if (!prefixName) return pathname

  const prefix = `/${prefixName}`
  if (pathname === prefix) return '/'
  return pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : pathname
}

export function installNativeHashNavigationListener(refs: HashNavigationRefs, getAliases: (pathname: string) => Record<string, string> | undefined, routePrefix = '/'): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleHashChange = () => {
    const pathname = routePathFromBrowserPath(window.location.pathname, routePrefix)
    coordinateHashNavigation({
      ...refs,
      location: { pathname, search: window.location.search, hash: window.location.hash },
      aliases: getAliases(pathname),
      source: 'native',
    })
  }
  window.addEventListener('hashchange', handleHashChange)
  return () => window.removeEventListener('hashchange', handleHashChange)
}

function explicitLocaleForPath(config: Config, pathname: string): string | undefined {
  const locales = config.locales
  if (!locales) return undefined
  const firstSegment = pathname.split('/').filter(Boolean)[0]
  return locales.locales.find((locale) => locale.code === firstSegment)?.code
}

function fallbackLocale(config: Config): string | undefined {
  return config.locales?.default
}

function storedLocaleForConfig(config: Config): string | null {
  return getStoredLocalePreference(config.locales?.locales.map(locale => locale.code))
}

function isDefaultLocale(config: Config, locale: string | undefined): boolean {
  return Boolean(locale && config.locales?.default === locale)
}

function hasPath(nodes: NavigationNode[], pathname: string, locale?: string): boolean {
  return nodes.some((node) => isSameRoutePath(node.path, pathname, locale) || hasPath(node.children ?? [], pathname, locale))
}

export function visibleNavigation(nodes: NavigationNode[], pathname: string, locale?: string): NavigationNode[] {
  return nodes.flatMap((node) => {
    if (node.visible === 'never') return []
    if (node.visible === 'active' && !hasPath([node], pathname, locale)) return []

    return [{
      ...node,
      children: node.visible === 'active'
        ? node.children
        : visibleNavigation(node.children ?? [], pathname, locale),
    }]
  })
}

type NavigationState = {
  items: NavigationNode[]
  tabs?: NavigationTab[]
}

function layoutForNavigation(nodes: NavigationNode[], pathname: string, inherited?: 'documentation' | 'blog'): 'documentation' | 'blog' | undefined {
  for (const node of nodes) {
    const layout = node.layout ?? inherited
    if (isSameRoutePath(node.path, pathname)) return layout
    const childLayout = layoutForNavigation(node.children ?? [], pathname, layout)
    if (childLayout) return childLayout
  }
  return undefined
}

export function resolvePageLayout(route: RouteItem | undefined, navigation: NavigationNode[], pathname: string): 'documentation' | 'blog' {
  return route?.layout ?? layoutForNavigation(navigation, pathname) ?? 'documentation'
}

export function navigationFromTabs(tabs: NavigationTab[], pathname: string, locale?: string): NavigationState {
  const currentTab = tabs.find((tab) => isSameRoutePath(tab.path, pathname, locale) || hasPath(tab.children, pathname, locale))
  const visibleTabs = tabs
    .map(tab => ({ ...tab, children: visibleNavigation(tab.children, pathname, locale) }))
    .filter(tab => tab.children.length > 0)
  const visibleCurrentTab = currentTab && visibleTabs.find(tab => tab === currentTab || tab.path === currentTab.path)
  return {
    items: visibleCurrentTab?.children ?? visibleTabs[0]?.children ?? [],
    tabs: visibleTabs,
  }
}

function navigationForLocale(navigation: NavigationTree, locale: string | undefined, pathname: string): NavigationState {
  switch (navigation.kind) {
    case 'flat':
      return { items: visibleNavigation(navigation.nodes, pathname, locale) }
    case 'tabbed':
      return navigationFromTabs(navigation.tabs, pathname, locale)
    case 'localized':
      return { items: locale ? visibleNavigation(navigation.locales[locale] ?? [], pathname, locale) : [] }
    case 'localized-tabbed':
      return locale && navigation.locales[locale] ? navigationFromTabs(navigation.locales[locale].tabs, pathname, locale) : { items: [] }
  }
}

function pageTitle(config: Config, route?: RouteItem): string {
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

function applyDocumentMetadata(config: Config, route?: RouteItem) {
  document.title = pageTitle(config, route)
  setNamedMeta('description', route?.description ?? config.description)
  setNamedMeta('keywords', route?.keywords?.join(', '))
}

function useRouteState(config: Config, routes: RouteItem[], navigation: NavigationTree, pathname: string) {
  const currentRoute = routeForPath(routes, pathname)
  const explicitLocale = explicitLocaleForPath(config, pathname)
  const storedLocale = storedLocaleForConfig(config)
  const currentLocale = explicitLocale ?? storedLocale ?? fallbackLocale(config)
  const currentLocaleConfig = config.locales?.locales.find((locale) => locale.code === currentLocale)
  const notFoundRoute = currentRoute ? undefined : notFoundRouteForPath(routes, pathname, currentLocale)
  const currentNavigation = navigationForLocale(navigation, currentLocale, pathname)
  const sections = sectionsForRoute(currentRoute)

  return {
    currentRoute,
    explicitLocale,
    storedLocale,
    currentLocale,
    currentLocaleConfig,
    notFoundRoute,
    currentNavigation,
    layout: resolvePageLayout(currentRoute, currentNavigation.items, pathname),
    sections,
  }
}

function useRenderedRoutes(routes: RouteItem[], notFoundRoute?: RouteItem) {
  const renderRoutes = useMemo(
    () => routes.map(route => ({ ...route, component: resolveRouteComponent(route) })),
    [routes],
  )
  const NotFoundRouteComponent = notFoundRoute
    ? renderRoutes.find(route => isSameRoutePath(route.path, notFoundRoute.path))?.component
    : undefined

  return { renderRoutes, NotFoundRouteComponent }
}

function emptySubscribe() {
  return () => {}
}

function useStoredBannerDismissed(storageKey: string | undefined) {
  return useSyncExternalStore(
    emptySubscribe,
    () => Boolean(storageKey && typeof window !== 'undefined' && window.localStorage.getItem(storageKey) === '1'),
    // Avoid SSR/hydration flash for dismissible banners by resolving dismissal on the client.
    () => true,
  )
}

function useBannerState(config: Config, currentLocale: string | undefined) {
  const banner = config.banner
  const bannerContent = banner
    ? resolveLocalizedText(banner.content, currentLocale, config.locales?.default)
    : ''
  const bannerStorageKey = banner && bannerContent ? `clarify:banner:dismissed:${config.title}:${bannerContent}` : undefined
  const storedBannerDismissed = useStoredBannerDismissed(banner?.dismissible ? bannerStorageKey : undefined)
  const [dismissedBannerKey, setDismissedBannerKey] = useState<string>()
  const activeBannerKey = banner ? JSON.stringify(banner) : undefined
  const bannerResolved = !banner?.dismissible || !storedBannerDismissed
  const hasBanner = Boolean(banner && bannerContent) && !storedBannerDismissed && dismissedBannerKey !== activeBannerKey

  return {
    activeBannerKey,
    bannerResolved,
    dismissedBannerKey,
    hasBanner,
    dismissBanner: () => setDismissedBannerKey(activeBannerKey),
  }
}

type StoredLocaleRedirectOptions = {
  config: Config
  routes: RouteItem[]
  pathname: string
  currentRoute?: RouteItem
  storedLocale: string | null
  explicitLocale?: string
  location: ReturnType<typeof useLocation>
  navigate: ReturnType<typeof useNavigate>
}

type AppShellNavigationEffectsArgs = StoredLocaleRedirectOptions & HashNavigationRefs

function useAppShellNavigationEffects(arg0: AppShellNavigationEffectsArgs) {
  const {
    config,
    currentRoute,
    explicitLocale,
    hashNavigationEpochRef,
    hashScrollCleanupRef,
    hashScrollSuppressedUntilRef,
    lastHandledLocationRef,
    location,
    navigate,
    pathname,
    routes,
    storedLocale,
  } = arg0
  useEffect(() => {
    if (explicitLocale) storeLocalePreference(explicitLocale)
  }, [explicitLocale])

  useEffect(() => {
    if (explicitLocale || !storedLocale || isDefaultLocale(config, storedLocale)) return
    const localizedPath = currentRoute?.alternates?.[storedLocale]
    if (!localizedPath || isSameRoutePath(localizedPath, pathname)) return
    navigate(`${localizedPath}${location.search}${location.hash}`, { replace: true })
  }, [config, currentRoute, explicitLocale, location.hash, location.search, navigate, pathname, storedLocale])

  useEffect(() => {
    if (typeof window === 'undefined') return
    coordinateHashNavigation({
      hashNavigationEpochRef,
      hashScrollCleanupRef,
      hashScrollSuppressedUntilRef,
      lastHandledLocationRef,
      location,
      aliases: currentRoute?.headingAliases,
      source: 'router',
    })
  }, [
    currentRoute?.headingAliases,
    hashNavigationEpochRef,
    hashScrollCleanupRef,
    hashScrollSuppressedUntilRef,
    lastHandledLocationRef,
    location,
  ])

  useEffect(() => installNativeHashNavigationListener({
    hashNavigationEpochRef,
    hashScrollCleanupRef,
    hashScrollSuppressedUntilRef,
    lastHandledLocationRef,
  }, nativePathname => routeForPath(routes, normalizeRoutePath(nativePathname))?.headingAliases, config.routePrefix), [
    config.routePrefix,
    hashNavigationEpochRef,
    hashScrollCleanupRef,
    hashScrollSuppressedUntilRef,
    lastHandledLocationRef,
    routes,
  ])

  useEffect(() => () => {
    hashScrollCleanupRef.current?.()
    hashScrollCleanupRef.current = undefined
  }, [hashScrollCleanupRef])
}

type AppShellDocumentEffectsArgs = {
  currentLocale: string | undefined
  currentLocaleConfig: LocaleConfig | undefined
  config: Config
  route?: RouteItem
}

function useAppShellDocumentEffects(arg0: AppShellDocumentEffectsArgs) {
  const { currentLocale, currentLocaleConfig, config, route } = arg0

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
    applyDocumentMetadata(config, route)
  }, [config, route])
}

type LayoutVariant = 'base' | 'banner' | 'tabs' | 'tabs-banner'

const appShellLayoutConfig: Record<LayoutVariant, AppShellLayoutConfig> = {
  base: {
    headerOffset: '3.5rem',
    sidebarScrollClassName: 'lg:top-14 lg:h-(--clarify-sidebar-height) lg:pt-10',
    contentClassName: 'pt-14',
  },
  banner: {
    headerOffset: '6.5rem',
    sidebarScrollClassName: 'lg:top-26 lg:h-(--clarify-sidebar-height-with-banner) lg:pt-10',
    contentClassName: 'pt-26',
  },
  tabs: {
    headerOffset: '7rem',
    sidebarScrollClassName: 'lg:top-28 lg:h-(--clarify-sidebar-height-with-tabs) lg:pt-10',
    contentClassName: 'pt-14 lg:pt-28',
  },
  'tabs-banner': {
    headerOffset: '10rem',
    sidebarScrollClassName: 'lg:top-40 lg:h-(--clarify-sidebar-height-with-tabs-and-banner) lg:pt-10',
    contentClassName: 'pt-26 lg:pt-40',
  },
}

function getLayoutVariant(hasTabs: boolean, hasBanner: boolean): LayoutVariant {
  if (hasTabs && hasBanner) return 'tabs-banner'
  if (hasTabs) return 'tabs'
  if (hasBanner) return 'banner'
  return 'base'
}

function getAppShellLayoutConfig(hasTabs: boolean, hasBanner: boolean): AppShellLayoutConfig {
  return appShellLayoutConfig[getLayoutVariant(hasTabs, hasBanner)]
}

export function AppShell(arg0: AppShellProps) {
  const { routes, navigation, runtimeSlots } = arg0
  const config = useConfig()
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = normalizeRoutePath(location.pathname)
  const headerRef = useRef<HTMLElement>(null)
  const headerTopAreaRef = useRef<HTMLDivElement>(null)
  const hashScrollSuppressedUntilRef = useRef(0)
  const hashNavigationEpochRef = useRef(0)
  const lastHandledLocationRef = useRef<HandledHashLocation | undefined>(undefined)
  const hashScrollCleanupRef = useRef<(() => void) | undefined>(undefined)
  const {
    currentRoute,
    explicitLocale,
    storedLocale,
    currentLocale,
    currentLocaleConfig,
    notFoundRoute,
    currentNavigation,
    layout,
    sections,
  } = useRouteState(config, routes, navigation, pathname)
  const text = useBuiltInText(currentLocale)
  const { activeBannerKey, bannerResolved, dismissedBannerKey, hasBanner, dismissBanner } = useBannerState(config, currentLocale)
  const hasTabs = Boolean(currentNavigation.tabs?.length)
  const hasSubnavTabs = hasTabs && config.layout?.tabs !== 'navbar'
  const layoutConfig = getAppShellLayoutConfig(hasSubnavTabs, hasBanner)
  const { renderRoutes, NotFoundRouteComponent } = useRenderedRoutes(routes, notFoundRoute)

  useAppShellNavigationEffects({
    config,
    currentRoute,
    explicitLocale,
    hashNavigationEpochRef,
    hashScrollCleanupRef,
    hashScrollSuppressedUntilRef,
    lastHandledLocationRef,
    location,
    navigate,
    pathname,
    routes,
    storedLocale,
  })
  useAppShellDocumentEffects({ currentLocale, currentLocaleConfig, config, route: currentRoute ?? notFoundRoute })

  return (
    <LocaleContext.Provider value={currentLocale}>
      <RuntimeSlotsProvider slots={runtimeSlots} route={currentRoute}>
        <SectionProvider sections={sections} headerTopAreaRef={headerTopAreaRef}>
          <SectionHashSync
            hashScrollSuppressedUntilRef={hashScrollSuppressedUntilRef}
            hashNavigationEpochRef={hashNavigationEpochRef}
          />
          <AppShellLayout
            config={config}
            routes={renderRoutes}
            currentRoute={currentRoute}
            currentLocale={currentLocale}
            currentNavigation={currentNavigation}
            notFoundRouteComponent={NotFoundRouteComponent}
            layout={layout}
            headerRef={headerRef}
            headerTopAreaRef={headerTopAreaRef}
            layoutConfig={layoutConfig}
            pathname={pathname}
            text={text}
            activeBannerKey={activeBannerKey}
            dismissedBannerKey={dismissedBannerKey}
            bannerResolved={bannerResolved}
            onDismissBanner={dismissBanner}
          />
        </SectionProvider></RuntimeSlotsProvider>
    </LocaleContext.Provider>)
  
}
