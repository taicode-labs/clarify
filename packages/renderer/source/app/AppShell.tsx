import clsx from 'clsx'
import { Suspense, lazy, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { ComponentType, CSSProperties } from 'react'
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom'

import { LocaleContext } from '../context'
import { useBuiltInText } from '../core/i18n'
import { Header, Navigation, TableOfContents } from '../shell'
import { RuntimeSlot, RuntimeSlotsProvider, type RuntimeSlots } from '../slots'
import { getStoredLocalePreference, storeLocalePreference } from '../theme/cookies'
import type { RouteItem, Config, LocaleConfig, NavigationNode, NavigationTab, NavigationTree, TabbedNavigation } from '../types'
import { safeDecodeURIComponent } from '../utils/hash'
import { resolveLocalizedText } from '../utils/localized-text'
import { isSameRoutePath, normalizeRoutePath } from '../utils/path'

import { BuiltWithClarify } from './BuiltWithClarify'
import { PageErrorBoundary } from './ErrorBoundary'
import { PageActionsProvider } from './PageActions'
import { PageBanner } from './PageBanner'
import { PageFooter } from './PageFooter'
import { PageNavigation } from './PageNavigation'
import { PageSkeleton } from './PageSkeleton'
import { SectionProvider, type Section } from './SectionProvider'

export type AppShellProps = {
  config: Config
  routes: RouteItem[]
  navigation: NavigationTree
  runtimeSlots?: RuntimeSlots
}

type BannerSlotProps = {
  activeBannerKey: string | undefined
  dismissedBannerKey: string | undefined
  bannerResolved: boolean
  onDismiss: () => void
  config: Config
  locale?: string
}

function BannerSlot(props: BannerSlotProps) {
  const { activeBannerKey, dismissedBannerKey, bannerResolved, onDismiss, config, locale } = props
  // 直接在插槽内部创建默认组件，这样它可以访问到上下文
  function DefaultBannerComponent() {
    const hasBanner = bannerResolved && Boolean(config.banner) && dismissedBannerKey !== activeBannerKey
    if (!hasBanner) return null
    return <PageBanner currentLocale={locale} onDismiss={onDismiss} />
  }
  
  return <RuntimeSlot name="page.banner.replace" default={DefaultBannerComponent} />
}

function DefaultFooterComponent() {
  return <PageFooter />
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

function explicitLocaleForPath(config: Config, pathname: string): string | undefined {
  const i18n = config.i18n
  if (!i18n) return undefined
  const firstSegment = pathname.split('/').filter(Boolean)[0]
  return i18n.locales.find((locale) => locale.code === firstSegment)?.code
}

function fallbackLocale(config: Config): string | undefined {
  return config.i18n?.defaultLocale
}

function storedLocaleForConfig(config: Config): string | null {
  return getStoredLocalePreference(config.i18n?.locales.map(locale => locale.code))
}

function isDefaultLocale(config: Config, locale: string | undefined): boolean {
  return Boolean(locale && config.i18n?.defaultLocale === locale)
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
  const currentLocaleConfig = config.i18n?.locales.find((locale) => locale.code === currentLocale)
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
    () => Boolean(storageKey && window.localStorage.getItem(storageKey) === '1'),
    () => false,
  )
}

function useBannerState(config: Config, currentLocale: string | undefined) {
  const banner = config.banner
  const bannerContent = banner
    ? resolveLocalizedText(banner.content, currentLocale, config.i18n?.defaultLocale)
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
  currentRoute?: RouteItem
  explicitLocale?: string
  location: ReturnType<typeof useLocation>
  navigate: ReturnType<typeof useNavigate>
  pathname: string
  storedLocale: string | null
}

function useStoredLocalePreference(explicitLocale: string | undefined) {
  useEffect(() => {
    if (explicitLocale) storeLocalePreference(explicitLocale)
  }, [explicitLocale])
}

function useStoredLocaleRedirect(arg0: StoredLocaleRedirectOptions) {
  const { config, currentRoute, explicitLocale, location, navigate, pathname, storedLocale } = arg0

  useEffect(() => {
    if (explicitLocale || !storedLocale || isDefaultLocale(config, storedLocale)) return
    const localizedPath = currentRoute?.alternates?.[storedLocale]
    if (!localizedPath || isSameRoutePath(localizedPath, pathname)) return
    navigate(`${localizedPath}${location.search}${location.hash}`, { replace: true })
  }, [config, currentRoute, explicitLocale, location.hash, location.search, navigate, pathname, storedLocale])
}

function useRouteScroll(location: ReturnType<typeof useLocation>) {
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
}

function useDocumentLanguage(currentLocale: string | undefined, currentLocaleConfig: LocaleConfig | undefined) {
  useEffect(() => {
    if (!currentLocale) return
    document.documentElement.lang = currentLocale
    if (currentLocaleConfig?.dir) {
      document.documentElement.dir = currentLocaleConfig.dir
    } else {
      document.documentElement.removeAttribute('dir')
    }
  }, [currentLocale, currentLocaleConfig?.dir])
}

function useDocumentMetadata(config: Config, route?: RouteItem) {
  useEffect(() => {
    applyDocumentMetadata(config, route)
  }, [config, route])
}

function headerOffsetForLayout(hasTabs: boolean, hasBanner: boolean) {
  if (hasTabs && hasBanner) return '10rem'
  if (hasTabs) return '7rem'
  if (hasBanner) return '6.5rem'
  return '3.5rem'
}

function sidebarScrollClassName(hasTabs: boolean, hasBanner: boolean) {
  const classNames = ['clarify-sidebar-scroll lg:sticky lg:z-30 lg:overflow-y-auto lg:pb-8']

  if (hasTabs && hasBanner) {
    classNames.push('lg:top-40 lg:h-(--clarify-sidebar-height-with-tabs-and-banner) lg:pt-10')
  } else if (hasTabs) {
    classNames.push('lg:top-28 lg:h-(--clarify-sidebar-height-with-tabs) lg:pt-10')
  } else if (hasBanner) {
    classNames.push('lg:top-26 lg:h-(--clarify-sidebar-height-with-banner) lg:pt-10')
  } else {
    classNames.push('lg:top-14 lg:h-(--clarify-sidebar-height) lg:pt-10')
  }

  return clsx(classNames)
}

function contentClassName(hasTabs: boolean, hasBanner: boolean) {
  const classNames = ['clarify-content @container relative flex min-h-screen min-w-0 flex-col px-4 pb-12 sm:px-6 lg:px-8 xl:px-10']

  if (hasTabs && hasBanner) {
    classNames.push('pt-26 lg:pt-40')
  } else if (hasTabs) {
    classNames.push('pt-14 lg:pt-28')
  } else if (hasBanner) {
    classNames.push('pt-26')
  } else {
    classNames.push('pt-14')
  }

  return clsx(classNames)
}

function BuiltInNotFoundPage() {
  const text = useBuiltInText()

  return (
    <section className="mx-auto flex min-h-(--clarify-error-page-min-height) max-w-2xl flex-col justify-center py-16 text-(--clarify-theme-tokens-colors-foreground)" aria-labelledby="clarify-not-found-title">
      <p className="text-sm/6 font-semibold text-(--clarify-theme-tokens-colors-primary)">{text('notFound.label')}</p>
      <h1 id="clarify-not-found-title" className="mt-3 text-3xl/9 font-semibold tracking-tight text-(--clarify-theme-tokens-colors-foreground)">{text('notFound.title')}</h1>
      <p className="mt-4 text-sm/6 text-(--clarify-theme-tokens-colors-muted)">{text('notFound.description')}</p>
      <div className="mt-8">
        <Link className="inline-flex items-center rounded-(--clarify-theme-tokens-radius-md) bg-(--clarify-theme-tokens-colors-primary) px-3 py-2 text-sm/5 font-semibold text-white shadow-xs transition hover:opacity-90" to="/">
          {text('notFound.home')}
        </Link>
      </div>
    </section>
  )
}

type NotFoundRouteElementProps = {
  component?: ComponentType;
}

function NotFoundRouteElement(props: NotFoundRouteElementProps) {
  const { component: RouteComponent } = props
  if (!RouteComponent) return <BuiltInNotFoundPage />
  return <RouteComponent />
}

export function AppShell(arg0: AppShellProps) {
  const { config, routes, navigation, runtimeSlots } = arg0
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = normalizeRoutePath(location.pathname)
  const headerRef = useRef<HTMLElement>(null)
  const {
    currentRoute,
    explicitLocale,
    storedLocale,
    currentLocale,
    currentLocaleConfig,
    notFoundRoute,
    currentNavigation,
    sections,
  } = useRouteState(config, routes, navigation, pathname)
  const text = useBuiltInText(currentLocale)
  const { activeBannerKey, bannerResolved, dismissedBannerKey, hasBanner, dismissBanner } = useBannerState(config, currentLocale)
  const hasTabs = Boolean(currentNavigation.tabs?.length)
  const { renderRoutes, NotFoundRouteComponent } = useRenderedRoutes(routes, notFoundRoute)

  useStoredLocalePreference(explicitLocale)
  useStoredLocaleRedirect({ config, currentRoute, explicitLocale, location, navigate, pathname, storedLocale })
  useRouteScroll(location)
  useDocumentLanguage(currentLocale, currentLocaleConfig)
  useDocumentMetadata(config, currentRoute ?? notFoundRoute)

  const layoutStyle = {
    '--clarify-header-offset': headerOffsetForLayout(hasTabs, hasBanner),
  } as CSSProperties

  function renderBannerSlot() {
    return (
      <BannerSlot
        activeBannerKey={activeBannerKey}
        dismissedBannerKey={dismissedBannerKey}
        bannerResolved={bannerResolved}
        onDismiss={dismissBanner}
        config={config}
        locale={currentLocale}
      />
    )
  }

  function renderHeader() {
    return (
      <Header
        ref={headerRef}
        config={config}
        navigation={currentNavigation.items}
        tabs={currentNavigation.tabs}
        routes={routes}
        currentLocale={currentLocale}
        currentRoute={currentRoute}
        banner={renderBannerSlot()}
      />
    )
  }

  function renderSidebar() {
    return (
      <aside
        data-pagefind-ignore
        className="clarify-sidebar hidden lg:block lg:self-stretch lg:bg-(--clarify-theme-tokens-colors-background) lg:px-5 xl:px-6"
      >
        <div className={sidebarScrollClassName(hasTabs, hasBanner)}>
          <Navigation navigation={currentNavigation.items} />
        </div>
      </aside>
    )
  }

  function renderTableOfContents() {
    if (!currentRoute || sections.length === 0) {
      return null
    }

    return (
      <aside
        data-pagefind-ignore
        className="clarify-toc-sidebar hidden xl:block xl:self-stretch xl:bg-(--clarify-theme-tokens-colors-background) xl:px-5"
      >
        <div className={sidebarScrollClassName(hasTabs, hasBanner)}>
          <TableOfContents currentPath={pathname} />
        </div>
      </aside>
    )
  }

  function renderRouteElements() {
    return (
      <Routes>
        {renderRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={<route.component />} />
        ))}
        <Route path="*" element={<NotFoundRouteElement component={NotFoundRouteComponent} />} />
      </Routes>
    )
  }

  function renderMain() {
    return (
      <main className="clarify-main min-w-0 flex-auto" data-pagefind-body>
        <PageErrorBoundary
          key={pathname}
          title={text('renderError.title')}
          description={text('renderError.description')}
          reloadLabel={text('renderError.reload')}
          detailsLabel={text('renderError.details')}
          pathLabel={text('renderError.path')}
          typeLabel={text('renderError.type')}
          messageLabel={text('renderError.message')}
          stackLabel={text('renderError.stack')}
          componentStackLabel={text('renderError.componentStack')}
          timestampLabel={text('renderError.timestamp')}
          copyLabel={text('actions.copy')}
          copiedLabel={text('actions.copied')}
          path={pathname}
        >
          <Suspense fallback={<PageSkeleton />}>
            {renderRouteElements()}
          </Suspense>
        </PageErrorBoundary>
      </main>
    )
  }

  function renderFooter() {
    return (
      <>
        <RuntimeSlot name="page.footer.before" />
        <RuntimeSlot name="page.footer.replace" default={DefaultFooterComponent} />
        <div className="flex justify-end">
          <BuiltWithClarify />
        </div>
      </>
    )
  }

  function renderContent() {
    return (
      <div className={contentClassName(hasTabs, hasBanner)}>
        <PageActionsProvider route={currentRoute} routePrefix={config.routePrefix}>
          {renderMain()}
          <PageNavigation navigation={currentNavigation.items} currentRoute={currentRoute} />
          {renderFooter()}
        </PageActionsProvider>
      </div>
    )
  }

  function renderLayout() {
    return (
      <div
        className="clarify-layout mx-auto grid w-full max-w-(--clarify-theme-layout-max-width) grid-cols-1 lg:grid-cols-(--clarify-layout-sidebar-grid) xl:grid-cols-(--clarify-layout-three-column-grid)"
        style={layoutStyle}
      >
        {renderSidebar()}
        {renderContent()}
        {renderTableOfContents()}
      </div>
    )
  }

  return (
    <LocaleContext.Provider value={currentLocale}>
      <RuntimeSlotsProvider slots={runtimeSlots} route={currentRoute}>
        <SectionProvider sections={sections} headerRef={headerRef}>
          {renderHeader()}
          {renderLayout()}
        </SectionProvider>
      </RuntimeSlotsProvider>
    </LocaleContext.Provider>
  )
}
