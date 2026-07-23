import { CloseButton, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import clsx from 'clsx'
import { LayoutGroup, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ChevronLeft, ChevronRight, Globe2, MoreHorizontal } from 'lucide-react'
import { forwardRef, useCallback, useEffect, useId, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { useConfig } from '../core/context'
import { useBuiltInText } from '../i18n'
import { storeLocalePreference } from '../theme/cookies'
import { ThemeToggle } from '../theme/ThemeToggle'
import type { Config, LocaleConfig, NavbarLink, NavigationNode, NavigationTab, RouteItem } from '../types'
import { isExternalHref, localizeHref, resolveHomeHref } from '../utils/href'
import { resolveLocalizedText } from '../utils/localized-text'
import { isSameRoutePath, normalizeRoutePath } from '../utils/path'

import { NavigationIcon } from './icons'
import { MobileNavigation, useIsInsideMobileNavigation, useMobileNavigationStore } from './mobile'
import { MobileSearch, Search } from './Search'
import { SiteLogo } from './SiteLogo'

function localizedRoutePath(config: Config, locale: string, route?: RouteItem): string | undefined {
  const alternatePath = route?.alternates?.[locale]
  if (alternatePath) return alternatePath
  if (route?.alternates) return undefined
  return localizeHref(route?.basePath ?? route?.path ?? '/', config, locale)
}

type LanguageSwitcherProps = { config: Config; currentLocale?: string; currentRoute?: RouteItem }

function LanguageSwitcher(arg0: LanguageSwitcherProps) {  const { config, currentLocale, currentRoute } = arg0

  const t = useBuiltInText()
  const location = useLocation()
  const locales = config.locales
  if (!locales || locales.locales.length < 2) return null

  const selectedLocale = currentLocale ?? locales.default
  const selectedLocaleConfig = locales.locales.find(locale => locale.code === selectedLocale) ?? locales.locales[0]
  const suffix = `${location.search}${location.hash}`

  return (
    <Menu as="div" className="clarify-language-switcher relative">
      <MenuButton
        className="clarify-language-switcher-button clarify-ui-control flex h-9 items-center gap-1.5 rounded-(--clarify-theme-tokens-radius-md) px-2 transition"
        aria-label={t('language.switch')}
      >
        <span className="absolute size-11 pointer-fine:hidden" />
        <Globe2 className="h-5 w-5 stroke-current" />
        <span className="hidden sm:inline">{selectedLocaleConfig?.label ?? selectedLocale}</span>
      </MenuButton>
      <MenuItems
        transition
        modal={false}
        className="clarify-language-switcher-menu clarify-ui-menu absolute right-0 z-50 mt-2 w-(--clarify-ui-menu-width) rounded-(--clarify-theme-tokens-radius-xl) bg-(--clarify-theme-tokens-colors-surface) p-1 shadow-lg ring-1 shadow-zinc-900/5 ring-(--clarify-theme-tokens-colors-border) transition data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in dark:bg-zinc-900 dark:ring-white/10"
      >
        {locales.locales.flatMap((locale: LocaleConfig) => {
          const localizedPath = localizedRoutePath(config, locale.code, currentRoute)
          if (!localizedPath) return []

          const selected = locale.code === selectedLocale
          return [
            <MenuItem key={locale.code}>
              {({ focus }) => (
                <Link
                  to={`${localizedPath}${suffix}`}
                  onClick={() => storeLocalePreference(locale.code)}
                  className={clsx(
                    'clarify-language-switcher-item clarify-ui-menu-item flex items-center justify-between rounded-(--clarify-theme-tokens-radius-lg) px-3 py-2 no-underline transition',
                    focus && 'clarify-ui-menu-item-focus',
                    selected && 'clarify-ui-menu-item-active',
                  )}
                  aria-current={selected ? 'true' : undefined}
                  lang={locale.code}
                  dir={locale.dir}
                >
                  <span>{locale.label}</span>
                  <span className="clarify-ui-menu-code">{locale.code}</span>
                </Link>
              )}
            </MenuItem>,
          ]
        })}
      </MenuItems>
    </Menu>
  )
}

type TopLevelNavItemProps = { href: string; active?: boolean; children: React.ReactNode }

function TopLevelNavItem(arg0: TopLevelNavItemProps) {  const { href, active = false, children } = arg0

  const external = isExternalHref(href)
  const className = clsx(
    'clarify-ui-top-link inline-flex h-9 items-center rounded-(--clarify-theme-tokens-radius-md) px-3 no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)',
    active && 'clarify-ui-top-link-active',
  )

  if (external) {
    return (
      <li>
        <a
          href={href}
          className={className}
          target="_blank"
          rel="noreferrer"
        >
          {children}
        </a>
      </li>
    )
  }

  return (
    <li>
      <Link
        to={href}
        className={className}
        aria-current={active ? 'page' : undefined}
      >
        {children}
      </Link>
    </li>
  )
}

type NavbarTabsProps = { tabs?: NavigationTab[]; currentLocale?: string }

function NavbarTabs(arg0: NavbarTabsProps) {  const { tabs, currentLocale } = arg0

  const pathname = normalizeRoutePath(useLocation().pathname)
  const t = useBuiltInText()

  if (!tabs?.length) return null

  return (
    <nav className="clarify-tabs-navbar hidden md:block" aria-label={t('navbar.sections')}>
      <ul role="list" className="flex items-center gap-0.5">
        {tabs.map((tab) => {
          const active = isActiveTab(tab, pathname, currentLocale)
          return (
            <TopLevelNavItem key={`${tab.title}-${tab.path}`} href={tab.path} active={active}>
              <NavigationIcon name={tab.icon} className="mr-1.5 h-4 w-4" />
              <span>{tab.title}</span>
            </TopLevelNavItem>
          )
        })}
      </ul>
    </nav>
  )
}

type MobileNavbarMenuProps = { links?: NavbarLink[]; config: Config; currentLocale?: string }

function MobileNavbarMenu(arg0: MobileNavbarMenuProps) {
  const { links, config, currentLocale } = arg0
  const t = useBuiltInText()
  if (!links?.length) return null

  return (
    <Menu as="div" className="clarify-mobile-navbar-menu relative md:hidden">
      <MenuButton
        className="clarify-mobile-navbar-menu-button clarify-ui-control relative flex size-9 items-center justify-center rounded-(--clarify-theme-tokens-radius-md) transition"
        aria-label={t('navbar.openLinks')}
      >
        <span className="absolute size-11 pointer-fine:hidden" />
        <MoreHorizontal className="h-5 w-5" />
      </MenuButton>
      <MenuItems
        transition
        anchor="bottom end"
        className="clarify-mobile-navbar-menu-list clarify-ui-menu z-50 mt-2 w-(--clarify-ui-menu-width) rounded-(--clarify-theme-tokens-radius-xl) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-1 shadow-lg transition [--anchor-gap:--spacing(2)] focus:outline-none data-closed:scale-95 data-closed:opacity-0 dark:border-white/10 dark:bg-zinc-900"
      >
        {links.map((link) => {
          const label = resolveLocalizedText(link.label, currentLocale, config.locales?.default)
          const href = localizeHref(link.href, config, currentLocale)
          const external = isExternalHref(href)

          return (
            <MenuItem key={link.href}>
              {({ focus }) => {
                const className = clsx(
                  'clarify-mobile-navbar-menu-item clarify-ui-menu-item block rounded-(--clarify-theme-tokens-radius-lg) px-3 py-2 no-underline transition',
                  focus && 'clarify-ui-menu-item-focus',
                )

                return external ? (
                  <a href={href} target="_blank" rel="noreferrer" className={className}>
                    {label}
                  </a>
                ) : (
                  <Link to={href} className={className}>
                    {label}
                  </Link>
                )
              }}
            </MenuItem>
          )
        })}
      </MenuItems>
    </Menu>
  )
}

function hasPath(nodes: NavigationNode[], pathname: string, currentLocale?: string): boolean {
  return nodes.some((node) => isSameRoutePath(node.path, pathname, currentLocale) || hasPath(node.children ?? [], pathname, currentLocale))
}

function isActiveTab(tab: NavigationTab, pathname: string, currentLocale?: string): boolean {
  return isSameRoutePath(tab.path, pathname, currentLocale) || hasPath(tab.children, pathname, currentLocale)
}

type ProductTabsProps = { tabs?: NavigationTab[]; currentLocale?: string }

function ProductTabs(arg0: ProductTabsProps) {  const { tabs, currentLocale } = arg0

  const t = useBuiltInText()
  const pathname = normalizeRoutePath(useLocation().pathname)
  const prefersReducedMotion = useReducedMotion()
  const indicatorGroupId = useId()
  const navRef = useRef<HTMLElement>(null)
  const activeTabRef = useRef<HTMLAnchorElement>(null)
  const [scrollState, setScrollState] = useState({ start: true, end: true })

  const updateScrollState = useCallback(() => {
    const nav = navRef.current
    if (!nav) return
    const maxScrollLeft = nav.scrollWidth - nav.clientWidth
    setScrollState({
      start: nav.scrollLeft <= 1,
      end: nav.scrollLeft >= maxScrollLeft - 1,
    })
  }, [])

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    updateScrollState()
    const resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(nav)
    return () => resizeObserver.disconnect()
  }, [tabs, updateScrollState])

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? 'instant' : 'smooth',
      block: 'nearest',
      inline: 'nearest',
    })
  }, [pathname, prefersReducedMotion])

  const scrollTabs = (direction: -1 | 1) => {
    const nav = navRef.current
    if (!nav) return
    nav.scrollBy({
      left: direction * Math.max(nav.clientWidth * 0.6, 240),
      behavior: prefersReducedMotion ? 'instant' : 'smooth',
    })
  }

  if (!tabs?.length) return null

  return (
    <div data-clarify-header-tabs className="clarify-product-tabs hidden h-14 border-t border-(--clarify-theme-tokens-colors-border) lg:block dark:border-white/10">
      <div
        className="clarify-product-tabs-frame relative mx-auto h-full w-full max-w-(--clarify-theme-layout-max-width)"
        data-at-start={scrollState.start || undefined}
        data-at-end={scrollState.end || undefined}
      >
        <button
          type="button"
          className="clarify-product-tabs-scroll clarify-product-tabs-scroll-start"
          onClick={() => scrollTabs(-1)}
          aria-label="Scroll sections left"
          tabIndex={scrollState.start ? -1 : 0}
          aria-hidden={scrollState.start}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <LayoutGroup id={indicatorGroupId}>
          <nav
            ref={navRef}
            className="clarify-product-tabs-nav flex h-full w-full items-stretch gap-2 overflow-x-auto px-5"
            aria-label={t('navbar.sections')}
            onScroll={updateScrollState}
          >
            {tabs.map((tab) => {
              const active = isActiveTab(tab, pathname, currentLocale)
              return (
                <Link
                  ref={active ? activeTabRef : undefined}
                  key={`${tab.title}-${tab.path}`}
                  to={tab.path}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(
                    'clarify-product-tab clarify-ui-tab relative inline-flex h-full shrink-0 items-center gap-2 px-3 no-underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--clarify-theme-tokens-colors-primary)',
                    active && 'clarify-ui-tab-active',
                  )}
                >
                  <NavigationIcon name={tab.icon} className="h-4 w-4" />
                  <span>{tab.title}</span>
                  {active ? (
                    <motion.span
                      layoutId="active-indicator"
                      className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-(--clarify-ui-tab-indicator)"
                      transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 38, mass: 0.7 }}
                    />
                  ) : null}
                </Link>
              )
            })}
          </nav>
        </LayoutGroup>
        <button
          type="button"
          className="clarify-product-tabs-scroll clarify-product-tabs-scroll-end"
          onClick={() => scrollTabs(1)}
          aria-label="Scroll sections right"
          tabIndex={scrollState.end ? -1 : 0}
          aria-hidden={scrollState.end}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export const Header = forwardRef<
  React.ComponentRef<'header'>,
  React.ComponentPropsWithoutRef<typeof motion.header> & {
    navigation: NavigationNode[]
    tabs?: NavigationTab[]
    routes: RouteItem[]
    currentLocale?: string
    currentRoute?: RouteItem
    banner?: React.ReactNode
    topAreaRef?: RefObject<HTMLDivElement | null>
  }
>(function Header(arg0, ref) {
  const { navigation, tabs, routes, currentLocale, currentRoute, banner, topAreaRef, className, ...props } = arg0
  const config = useConfig()

  const t = useBuiltInText()
  const pathname = normalizeRoutePath(useLocation().pathname)
  const { isOpen: mobileNavIsOpen } = useMobileNavigationStore()
  const isInsideMobileNavigation = useIsInsideMobileNavigation()
  const homeHref = resolveHomeHref(config, currentLocale)
  const homeExternal = isExternalHref(homeHref)

  const { scrollY } = useScroll()
  const bgOpacityLight = useTransform(scrollY, [0, 72], ['70%', '95%'])
  const bgOpacityDark = useTransform(scrollY, [0, 72], ['60%', '92%'])
  const hasNavbarLinks = Boolean(config.navigation?.links?.length)
  const tabsInNavbar = config.layout?.tabs === 'navbar'

  function renderBrand() {
    if (homeExternal) {
      return (
        <CloseButton as="a" href={homeHref} aria-label={t('navbar.home')} className="clarify-brand flex min-w-0 items-center gap-2 no-underline">
          <SiteLogo logo={config.logo} className="h-6 w-auto shrink-0 object-contain" />
          <span className="clarify-brand-title truncate font-semibold">{config.title}</span>
        </CloseButton>
      )
    }

    return (
      <CloseButton as={Link} to={homeHref} aria-label={t('navbar.home')} className="clarify-brand flex min-w-0 items-center gap-2 no-underline">
        <SiteLogo logo={config.logo} className="h-6 w-auto shrink-0 object-contain" />
        <span className="clarify-brand-title truncate font-semibold">{config.title}</span>
      </CloseButton>
    )
  }

  function renderTopLinks() {
    if (!hasNavbarLinks) return null

    return (
      <nav className="clarify-top-nav hidden md:block" aria-label={t('navbar.sections')}>
        <ul role="list" className="flex items-center gap-0.5">
          {config.navigation?.links?.map((link) => {
            const href = localizeHref(link.href, config, currentLocale)
            const active = !isExternalHref(href) && isSameRoutePath(href, pathname, currentLocale)

            return (
              <TopLevelNavItem key={link.href} href={href} active={active}>
                {resolveLocalizedText(link.label, currentLocale, config.locales?.default)}
              </TopLevelNavItem>
            )
          })}
        </ul>
      </nav>
    )
  }

  function renderHeaderActions() {
    return (
      <div className="clarify-header-actions flex shrink-0 items-center gap-1">
        {tabsInNavbar ? <Search compact routes={routes} navigation={navigation} /> : null}
        {tabsInNavbar ? <NavbarTabs tabs={tabs} currentLocale={currentLocale} /> : null}
        {renderTopLinks()}
        {hasNavbarLinks ? <div className="mx-2 hidden h-5 w-px bg-(--clarify-theme-tokens-colors-border) md:block md:dark:bg-white/15" /> : null}
        <MobileSearch routes={routes} navigation={navigation} />
        <LanguageSwitcher config={config} currentLocale={currentLocale} currentRoute={currentRoute} />
        <ThemeToggle />
        <MobileNavbarMenu links={config.navigation?.links} config={config} currentLocale={currentLocale} />
      </div>
    )
  }

  function renderHeaderMain() {
    return (
      <div
        data-clarify-header-main
        className={clsx(
          'clarify-header-main relative mx-auto flex h-14 w-full max-w-(--clarify-theme-layout-max-width) items-center justify-between gap-6 px-4 sm:px-6 lg:px-5',
          (isInsideMobileNavigation || !mobileNavIsOpen) && 'shadow-none',
        )}
      >
        <div className="clarify-header-left flex min-w-0 items-center gap-5">
          <div className="clarify-mobile-brand flex items-center gap-5 lg:hidden">
            <MobileNavigation navigation={navigation} tabs={tabs} routes={routes} currentLocale={currentLocale} currentRoute={currentRoute} />
          </div>
          {renderBrand()}
        </div>
        {!tabsInNavbar ? (
          <div className="clarify-header-center absolute left-1/2 hidden -translate-x-1/2 lg:block">
            <Search routes={routes} navigation={navigation} />
          </div>
        ) : null}
        {renderHeaderActions()}
      </div>
    )
  }

  function renderTopArea() {
    return (
      <div ref={topAreaRef}>
        {renderHeaderMain()}
        <div data-clarify-header-banner>{banner}</div>
        {!tabsInNavbar ? <ProductTabs tabs={tabs} currentLocale={currentLocale} /> : null}
      </div>
    )
  }

  return (
    <motion.header
      {...props}
      ref={ref}
      data-pagefind-ignore
      className={clsx(
        className,
        'clarify-header fixed inset-x-0 top-0 z-50 border-b border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-background)/(--bg-opacity-light) backdrop-blur-xs transition dark:border-white/10 dark:bg-zinc-950/(--bg-opacity-dark) dark:backdrop-blur-sm',
        isInsideMobileNavigation && 'bg-(--clarify-theme-tokens-colors-background) dark:bg-zinc-950',
      )}
      style={
        {
          '--bg-opacity-light': bgOpacityLight,
          '--bg-opacity-dark': bgOpacityDark,
        } as React.CSSProperties
      }
    >
      {renderTopArea()}
    </motion.header>
  )
})
