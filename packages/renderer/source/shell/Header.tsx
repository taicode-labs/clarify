import { CloseButton, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import clsx from 'clsx'
import { motion, useScroll, useTransform } from 'framer-motion'
import { forwardRef } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { Logo, ThemeToggle } from '../components'
import type { ClarifyConfig, ClarifyLocalizedText, ClarifyLocaleConfig, ClarifyLogoConfig, NavigationNode, RouteItem } from '../types'

import { MobileNavigation, useIsInsideMobileNavigation, useMobileNavigationStore } from './mobile'
import { MobileSearch, Search } from './Search'

function resolveLogoUrl(logo?: ClarifyLogoConfig): string | undefined {
  if (typeof logo === 'string') return logo
  if (logo && typeof logo === 'object') return logo.light ?? logo.dark
  return undefined
}

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
    <Menu as="div" className="relative">
      <MenuButton
        className="flex h-7 items-center gap-1.5 rounded-md px-1.5 text-sm/5 font-medium text-zinc-600 transition hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
        aria-label="Switch language"
      >
        <span className="absolute size-12 pointer-fine:hidden" />
        <LanguageIcon className="h-5 w-5 stroke-current" />
        <span className="hidden sm:inline">{selectedLocaleConfig?.label ?? selectedLocale}</span>
      </MenuButton>
      <MenuItems
        transition
        className="absolute right-0 z-50 mt-2 w-44 rounded-xl bg-white p-1 text-sm shadow-lg ring-1 shadow-zinc-900/5 ring-zinc-900/10 transition data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in dark:bg-zinc-900 dark:ring-white/10"
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
                    'flex items-center justify-between rounded-lg px-3 py-2 no-underline transition',
                    focus && 'bg-zinc-100 dark:bg-white/5',
                    selected ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400',
                  )}
                  aria-current={selected ? 'true' : undefined}
                  lang={locale.code}
                  dir={locale.dir}
                >
                  <span>{locale.label}</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">{locale.code}</span>
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
          className="text-sm/5 text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
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
        className="text-sm/5 text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
      >
        {children}
      </Link>
    </li>
  )
}

export const Header = forwardRef<
  React.ComponentRef<'div'>,
  React.ComponentPropsWithoutRef<typeof motion.div> & {
    config: ClarifyConfig
    navigation: NavigationNode[]
    routes: RouteItem[]
    currentLocale?: string
    currentRoute?: RouteItem
  }
>(function Header(arg0, ref) {  const { config, navigation, routes, currentLocale, currentRoute, className, ...props } = arg0

  const { isOpen: mobileNavIsOpen } = useMobileNavigationStore()
  const isInsideMobileNavigation = useIsInsideMobileNavigation()
  const logoUrl = resolveLogoUrl(config.logo)

  const { scrollY } = useScroll()
  const bgOpacityLight = useTransform(scrollY, [0, 72], ['50%', '90%'])
  const bgOpacityDark = useTransform(scrollY, [0, 72], ['20%', '80%'])

  return (
    <motion.div
      {...props}
      ref={ref}
      className={clsx(
        className,
        'fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between gap-12 px-4 transition sm:px-6 lg:left-72 lg:z-30 lg:px-8 xl:left-80',
        !isInsideMobileNavigation && 'backdrop-blur-xs lg:left-72 xl:left-80 dark:backdrop-blur-sm',
        isInsideMobileNavigation
          ? 'bg-white dark:bg-zinc-950'
          : 'bg-white/(--bg-opacity-light) dark:bg-zinc-950/(--bg-opacity-dark)',
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
          'absolute inset-x-0 top-full h-px transition',
          (isInsideMobileNavigation || !mobileNavIsOpen) && 'bg-zinc-900/7.5 dark:bg-white/7.5',
        )}
      />
      <div className="hidden lg:block" />
      <div className="flex items-center gap-5 lg:hidden">
        <MobileNavigation config={config} navigation={navigation} routes={routes} currentLocale={currentLocale} currentRoute={currentRoute} />
        <CloseButton as={Link} to={localizeHref('/', config, currentLocale)} aria-label="Home" className="flex items-center gap-2 no-underline">
          {logoUrl ? <img src={logoUrl} alt="" className="h-6 w-6" /> : <Logo className="h-6" />}
          <span className="sr-only">{config.title}</span>
        </CloseButton>
      </div>
      <div className="flex items-center gap-5">
        <Search routes={routes} navigation={navigation} />
        {config.navbar?.links?.length ? (
          <nav className="hidden md:block">
            <ul role="list" className="flex items-center gap-8">
              {config.navbar.links.map((link) => (
                <TopLevelNavItem key={link.href} href={localizeHref(link.href, config, currentLocale)}>
                  {resolveLocalizedText(link.label, currentLocale, config.i18n?.defaultLocale)}
                </TopLevelNavItem>
              ))}
            </ul>
          </nav>
        ) : null}
        {config.navbar?.links?.length ? <div className="hidden md:block md:h-5 md:w-px md:bg-zinc-900/10 md:dark:bg-white/15" /> : null}
        <MobileSearch routes={routes} navigation={navigation} />
        <LanguageSwitcher config={config} currentLocale={currentLocale} currentRoute={currentRoute} />
        <ThemeToggle />
      </div>
    </motion.div>
  )
})
