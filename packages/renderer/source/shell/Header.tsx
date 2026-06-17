import { CloseButton } from '@headlessui/react'
import clsx from 'clsx'
import { motion, useScroll, useTransform } from 'framer-motion'
import { forwardRef } from 'react'
import { Link } from 'react-router-dom'

import { Button, Logo, ThemeToggle } from '../components'
import type { ClarifyConfig, ClarifyLogoConfig, NavigationNode, RouteItem } from '../types'

import { MobileNavigation, useIsInsideMobileNavigation, useMobileNavigationStore } from './mobile'
import { MobileSearch, Search } from './Search'

function resolveLogoUrl(logo?: ClarifyLogoConfig): string | undefined {
  if (typeof logo === 'string') return logo
  if (logo && typeof logo === 'object') return logo.light ?? logo.dark
  return undefined
}

function TopLevelNavItem({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith('http')

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
  }
>(function Header({ config, navigation, routes, className, ...props }, ref) {
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
          ? 'bg-white dark:bg-zinc-900'
          : 'bg-white/(--bg-opacity-light) dark:bg-zinc-900/(--bg-opacity-dark)',
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
        <MobileNavigation config={config} navigation={navigation} routes={routes} />
        <CloseButton as={Link} to="/" aria-label="Home" className="flex items-center gap-2 no-underline">
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
                <TopLevelNavItem key={link.href} href={link.href}>
                  {link.label}
                </TopLevelNavItem>
              ))}
            </ul>
          </nav>
        ) : null}
        {config.navbar?.links?.length ? <div className="hidden md:block md:h-5 md:w-px md:bg-zinc-900/10 md:dark:bg-white/15" /> : null}
        <MobileSearch routes={routes} navigation={navigation} />
        <ThemeToggle />
        <div className="hidden min-[416px]:contents">
          <Button href="/" variant="secondary">
            {config.title}
          </Button>
        </div>
      </div>
    </motion.div>
  )
})
