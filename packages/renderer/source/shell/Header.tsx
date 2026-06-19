import { CloseButton, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import clsx from 'clsx'
import { MoreHorizontal } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { forwardRef } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { ThemeToggle } from '../components'
import { SiteLogo } from '../components/SiteLogo'
import type { ClarifyConfig, ClarifyLocalizedText, ClarifyLocaleConfig, ClarifyNavbarLink, NavigationNode, NavigationTab, RouteItem } from '../types'

import { NavigationIcon } from './icons'
import { MobileNavigation, useIsInsideMobileNavigation, useMobileNavigationStore } from './mobile'
import { MobileSearch, Search } from './Search'

function resolveLocalizedText(text: ClarifyLocalizedText, locale?: string, fallbackLocale?: string): string {
  if (typeof text === 'string') return text
  return (locale ? text[locale] : undefined) ?? (fallbackLocale ? text[fallbackLocale] : undefined) ?? Object.values(text)[0] ?? ''
}

function isExternalHref(href: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')
}

function localizeHref(href: string, config: ClarifyConfig, locale?: string): string {
  if (!locale || !config.i18n || isExternalHref(href) || href.startsWith('#')) return href
  if (locale === config.i18n.defaultLocale) return href
  const cleanHref = href === '/' ? '' : href.replace(/^\/+/, '')
  return `/${locale}${cleanHref ? `/${cleanHref}` : ''}`
}

function localizedRoutePath(config: ClarifyConfig, locale: string, route?: RouteItem): string | undefined {
  const alternatePath = route?.alternates?.[locale]
  if (alternatePath) return alternatePath
  if (route?.alternates) return undefined
  return localizeHref(route?.basePath ?? route?.path ?? '/', config, locale)
}

function LanguageIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path d="M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z" />
      <path d="M2.5 10h15M10 2.5c2 2.05 3 4.55 3 7.5s-1 5.45-3 7.5c-2-2.05-3-4.55-3-7.5s1-5.45 3-7.5Z" />
    </svg>
  )
}

function LanguageSwitcher(arg0: { config: ClarifyConfig; currentLocale?: string; currentRoute?: RouteItem }) {  const { config, currentLocale, currentRoute } = arg0

  const location = useLocation()
  const i18n = config.i18n
  if (!i18n || i18n.locales.length < 2) return null

  const selectedLocale = currentLocale ?? i18n.defaultLocale
  const selectedLocaleConfig = i18n.locales.find(locale => locale.code === selectedLocale) ?? i18n.locales[0]
  const suffix = `${location.search}${location.hash}`

  return (
    <Menu as="div" className="clarify-language-switcher relative">
      <MenuButton
        className="clarify-language-switcher-button flex h-7 items-center gap-1.5 rounded-(--clarify-theme-tokens-radius-md) px-1.5 text-sm/5 font-medium text-(--clarify-theme-tokens-colors-muted) transition hover:bg-[color-mix(in_srgb,var(--clarify-theme-tokens-colors-foreground)_5%,transparent)] hover:text-(--clarify-theme-tokens-colors-foreground) dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
        aria-label="Switch language"
      >
        <span className="absolute size-12 pointer-fine:hidden" />
        <LanguageIcon className="h-5 w-5 stroke-current" />
        <span className="hidden sm:inline">{selectedLocaleConfig?.label ?? selectedLocale}</span>
      </MenuButton>
      <MenuItems
        transition
        className="clarify-language-switcher-menu absolute right-0 z-50 mt-2 w-44 rounded-(--clarify-theme-tokens-radius-xl) bg-(--clarify-theme-tokens-colors-surface) p-1 text-sm shadow-lg ring-1 shadow-zinc-900/5 ring-(--clarify-theme-tokens-colors-border) transition data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in dark:bg-zinc-900 dark:ring-white/10"
      >
        {i18n.locales.flatMap((locale: ClarifyLocaleConfig) => {
          const localizedPath = localizedRoutePath(config, locale.code, currentRoute)
          if (!localizedPath) return []

          const selected = locale.code === selectedLocale
          return [
            <MenuItem key={locale.code}>
              {({ focus }) => (
                <Link
                  to={`${localizedPath}${suffix}`}
                  className={clsx(
                    'clarify-language-switcher-item flex items-center justify-between rounded-(--clarify-theme-tokens-radius-lg) px-3 py-2 no-underline transition',
                    focus && 'bg-[color-mix(in_srgb,var(--clarify-theme-tokens-colors-foreground)_5%,transparent)] dark:bg-white/5',
                    selected ? 'text-(--clarify-theme-tokens-colors-foreground) dark:text-white' : 'text-(--clarify-theme-tokens-colors-muted) dark:text-zinc-400',
                  )}
                  aria-current={selected ? 'true' : undefined}
                  lang={locale.code}
                  dir={locale.dir}
                >
                  <span>{locale.label}</span>
                  <span className="text-xs text-(--clarify-theme-tokens-colors-muted) dark:text-zinc-500">{locale.code}</span>
                </Link>
              )}
            </MenuItem>,
          ]
        })}
      </MenuItems>
    </Menu>
  )
}

function TopLevelNavItem(arg0: { href: string; children: React.ReactNode }) {  const { href, children } = arg0

  const external = isExternalHref(href)

  if (external) {
    return (
      <li>
        <a
          href={href}
          className="text-sm/5 font-medium text-(--clarify-theme-tokens-colors-muted) transition hover:text-(--clarify-theme-tokens-colors-foreground) dark:text-zinc-400 dark:hover:text-white"
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
        className="text-sm/5 font-medium text-(--clarify-theme-tokens-colors-muted) transition hover:text-(--clarify-theme-tokens-colors-foreground) dark:text-zinc-400 dark:hover:text-white"
      >
        {children}
      </Link>
    </li>
  )
}

function MobileNavbarMenu(arg0: { links?: ClarifyNavbarLink[]; config: ClarifyConfig; currentLocale?: string }) {
  const { links, config, currentLocale } = arg0
  if (!links?.length) return null

  return (
    <Menu as="div" className="clarify-mobile-navbar-menu relative md:hidden">
      <MenuButton
        className="clarify-mobile-navbar-menu-button relative flex size-8 items-center justify-center rounded-(--clarify-theme-tokens-radius-md) text-(--clarify-theme-tokens-colors-muted) transition hover:bg-[color-mix(in_srgb,var(--clarify-theme-tokens-colors-foreground)_5%,transparent)] hover:text-(--clarify-theme-tokens-colors-foreground) dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
        aria-label="Open navigation links"
      >
        <span className="absolute size-12 pointer-fine:hidden" />
        <MoreHorizontal className="h-5 w-5" />
      </MenuButton>
      <MenuItems
        transition
        anchor="bottom end"
        className="clarify-mobile-navbar-menu-list z-50 mt-2 w-48 rounded-(--clarify-theme-tokens-radius-xl) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-1 text-sm shadow-lg transition [--anchor-gap:--spacing(2)] focus:outline-none data-closed:scale-95 data-closed:opacity-0 dark:border-white/10 dark:bg-zinc-900"
      >
        {links.map((link) => {
          const label = resolveLocalizedText(link.label, currentLocale, config.i18n?.defaultLocale)
          const href = localizeHref(link.href, config, currentLocale)
          const external = isExternalHref(href)

          return (
            <MenuItem key={link.href}>
              {({ focus }) => {
                const className = clsx(
                  'clarify-mobile-navbar-menu-item block rounded-(--clarify-theme-tokens-radius-lg) px-3 py-2 no-underline transition',
                  focus && 'bg-[color-mix(in_srgb,var(--clarify-theme-tokens-colors-foreground)_5%,transparent)] dark:bg-white/5',
                  'text-(--clarify-theme-tokens-colors-muted) hover:text-(--clarify-theme-tokens-colors-foreground) dark:text-zinc-300 dark:hover:text-white',
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

function hasPath(nodes: NavigationNode[], pathname: string): boolean {
  return nodes.some((node) => node.path === pathname || hasPath(node.children ?? [], pathname))
}

function isActiveTab(tab: NavigationTab, pathname: string): boolean {
  return tab.path === pathname || hasPath(tab.children, pathname)
}

function ProductTabs(arg0: { tabs?: NavigationTab[] }) {  const { tabs } = arg0

  const pathname = useLocation().pathname
  if (!tabs?.length) return null

  return (
    <div className="clarify-product-tabs hidden h-14 border-t border-(--clarify-theme-tokens-colors-border) lg:block dark:border-white/10">
      <nav className="clarify-product-tabs-nav mx-auto flex h-full w-full max-w-(--clarify-theme-layout-max-width) items-stretch gap-6 overflow-x-auto px-5" aria-label="Documentation sections">
        {tabs.map((tab) => {
          const active = isActiveTab(tab, pathname)
          return (
            <Link
              key={`${tab.title}-${tab.path}`}
              to={tab.path}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'clarify-product-tab relative inline-flex shrink-0 items-center gap-2 px-0 text-sm font-medium transition',
                active
                  ? 'text-(--clarify-theme-tokens-colors-foreground) dark:text-white'
                  : 'text-(--clarify-theme-tokens-colors-muted) hover:text-(--clarify-theme-tokens-colors-foreground) dark:text-zinc-400 dark:hover:text-white',
              )}
            >
              <NavigationIcon name={tab.icon} className="h-4 w-4" />
              <span>{tab.title}</span>
              {active ? (
                <motion.span
                  layoutId="clarify-product-tab-indicator"
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-(--clarify-theme-tokens-colors-foreground) dark:bg-white"
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                />
              ) : null}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export const Header = forwardRef<
  React.ComponentRef<'header'>,
  React.ComponentPropsWithoutRef<typeof motion.header> & {
    config: ClarifyConfig
    navigation: NavigationNode[]
    tabs?: NavigationTab[]
    routes: RouteItem[]
    currentLocale?: string
    currentRoute?: RouteItem
  }
>(function Header(arg0, ref) {  const { config, navigation, tabs, routes, currentLocale, currentRoute, className, ...props } = arg0

  const { isOpen: mobileNavIsOpen } = useMobileNavigationStore()
  const isInsideMobileNavigation = useIsInsideMobileNavigation()

  const { scrollY } = useScroll()
  const bgOpacityLight = useTransform(scrollY, [0, 72], ['70%', '95%'])
  const bgOpacityDark = useTransform(scrollY, [0, 72], ['60%', '92%'])

  return (
    <motion.header
      {...props}
      ref={ref}
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
      <div
        className={clsx(
          'clarify-header-main relative mx-auto flex h-14 w-full max-w-(--clarify-theme-layout-max-width) items-center justify-between gap-6 px-4 sm:px-6 lg:px-5',
          (isInsideMobileNavigation || !mobileNavIsOpen) && 'shadow-none',
        )}
      >
        <div className="clarify-header-left flex min-w-0 items-center gap-5">
          <div className="clarify-mobile-brand flex items-center gap-5 lg:hidden">
            <MobileNavigation config={config} navigation={navigation} tabs={tabs} routes={routes} currentLocale={currentLocale} currentRoute={currentRoute} />
          </div>
          <CloseButton as={Link} to={localizeHref('/', config, currentLocale)} aria-label="Home" className="clarify-brand flex min-w-0 items-center gap-2 no-underline">
            <SiteLogo logo={config.logo} className="h-6 w-6 shrink-0" />
            <span className="clarify-brand-title truncate text-sm font-semibold text-(--clarify-theme-tokens-colors-foreground) dark:text-white">{config.title}</span>
          </CloseButton>
        </div>
        <div className="clarify-header-center absolute left-1/2 hidden -translate-x-1/2 lg:block">
          <Search routes={routes} navigation={navigation} />
        </div>
        <div className="clarify-header-actions flex shrink-0 items-center gap-5">
          {config.navbar?.links?.length ? (
            <nav className="clarify-top-nav hidden md:block">
              <ul role="list" className="flex items-center gap-8">
                {config.navbar.links.map((link) => (
                  <TopLevelNavItem key={link.href} href={localizeHref(link.href, config, currentLocale)}>
                    {resolveLocalizedText(link.label, currentLocale, config.i18n?.defaultLocale)}
                  </TopLevelNavItem>
                ))}
              </ul>
            </nav>
          ) : null}
          {config.navbar?.links?.length ? <div className="hidden md:block md:h-5 md:w-px md:bg-(--clarify-theme-tokens-colors-border) md:dark:bg-white/15" /> : null}
          <MobileSearch routes={routes} navigation={navigation} />
          <LanguageSwitcher config={config} currentLocale={currentLocale} currentRoute={currentRoute} />
          <ThemeToggle />
          <MobileNavbarMenu links={config.navbar?.links} config={config} currentLocale={currentLocale} />
        </div>
      </div>
      <ProductTabs tabs={tabs} />
    </motion.header>
  )
})
