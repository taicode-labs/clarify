import { Dialog, DialogBackdrop, DialogPanel, Menu, MenuButton, MenuItem, MenuItems, TransitionChild } from '@headlessui/react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { createContext, Suspense, useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { create } from 'zustand'

import { useBuiltInText } from '../i18n'
import type { ClarifyConfig, NavigationNode, NavigationTab, RouteItem } from '../types'
import { isSameRoutePath, normalizeRoutePath } from '../utils/path'

import { Header } from './Header'
import { NavigationIcon } from './icons'
import { Navigation } from './Navigation'

function MenuIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 10 9" fill="none" strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="M.5 1h9M.5 8h9M.5 4.5h9" />
    </svg>
  )
}

function XIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 10 9" fill="none" strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="m1.5 1 7 7M8.5 1l-7 7" />
    </svg>
  )
}

const IsInsideMobileNavigationContext = createContext(false)

function hasPath(nodes: NavigationNode[], pathname: string): boolean {
  return nodes.some((node) => isSameRoutePath(node.path, pathname) || hasPath(node.children ?? [], pathname))
}

function isActiveTab(tab: NavigationTab, pathname: string): boolean {
  return isSameRoutePath(tab.path, pathname) || hasPath(tab.children, pathname)
}

function MobileTabsSelect(arg0: { tabs?: NavigationTab[] }) {
  const { tabs } = arg0
  const pathname = normalizeRoutePath(useLocation().pathname)
  const { close } = useMobileNavigationStore()
  if (!tabs?.length) return null

  const activeTab = tabs.find((tab) => isActiveTab(tab, pathname)) ?? tabs[0]

  return (
    <Menu as="div" className="clarify-mobile-tabs-select mb-6">
      <MenuButton className="clarify-mobile-tabs-select-trigger clarify-ui-control group flex h-10 w-full items-center justify-between gap-2 rounded-(--clarify-theme-tokens-radius-xl) border border-(--clarify-theme-tokens-colors-border) px-4 text-left font-semibold shadow-xs shadow-zinc-900/5 transition dark:border-white/10">
        <span className="flex min-w-0 items-center gap-2">
          <NavigationIcon name={activeTab.icon} className="h-4 w-4 shrink-0 text-(--clarify-theme-tokens-colors-primary)" />
          <span className="truncate tracking-[-0.01em]">{activeTab.title}</span>
        </span>
        <svg width="8" height="24" viewBox="0 -9 3 24" aria-hidden="true" className="shrink-0 overflow-visible text-(--clarify-theme-tokens-colors-muted) transition-transform group-aria-expanded:rotate-180">
          <path d="M0 0L3 3L0 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </MenuButton>
      <MenuItems className="clarify-mobile-tabs-select-list clarify-ui-menu mt-2 flex flex-col gap-1 rounded-(--clarify-theme-tokens-radius-xl) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-1 shadow-lg shadow-zinc-900/5 focus:outline-none dark:border-white/10 dark:bg-zinc-900 dark:shadow-none">
        {tabs.map((tab) => {
          const active = isActiveTab(tab, pathname)

          return (
            <MenuItem key={`${tab.title}-${tab.path}`}>
              <Link
                to={tab.path}
                onClick={close}
                className={clsx(
                  'clarify-mobile-tabs-select-item clarify-ui-menu-item flex items-center justify-between gap-3 rounded-(--clarify-theme-tokens-radius-lg) px-3 py-2.5 no-underline transition',
                  active && 'clarify-ui-menu-item-active',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <span className="flex min-w-0 items-start gap-2">
                  <NavigationIcon name={tab.icon} className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0 whitespace-normal wrap-anywhere font-medium leading-5">{tab.title}</span>
                </span>
                {active ? (
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0">
                    <path d="m5 10 3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </Link>
            </MenuItem>
          )
        })}
      </MenuItems>
    </Menu>
  )
}

function MobileNavigationDialog(arg0: {
  config: ClarifyConfig
  isOpen: boolean
  navigation: NavigationNode[]
  tabs?: NavigationTab[]
  routes: RouteItem[]
  currentLocale?: string
  currentRoute?: RouteItem
  close: () => void
}) {  const {
  config,
  isOpen,
  navigation,
  tabs,
  routes,
  currentLocale,
  currentRoute,
  close,
} = arg0

  return (
    <Dialog transition open={isOpen} onClose={close} className="clarify-mobile-navigation-dialog fixed inset-0 z-50 lg:hidden">
      <DialogBackdrop
        transition
        className="clarify-mobile-navigation-backdrop clarify-ui-backdrop fixed inset-0 top-14 backdrop-blur-xs data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <DialogPanel>
        <TransitionChild>
          <Header
            config={config}
            navigation={navigation}
            tabs={tabs}
            routes={routes}
            currentLocale={currentLocale}
            currentRoute={currentRoute}
            className="data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
          />
        </TransitionChild>

        <TransitionChild>
          <motion.div
            layoutScroll
            className="clarify-mobile-navigation-panel fixed top-14 bottom-0 left-0 w-full overflow-y-auto bg-(--clarify-theme-tokens-colors-background) px-4 pt-6 pb-4 shadow-lg ring-1 shadow-zinc-900/10 ring-(--clarify-theme-tokens-colors-border) duration-500 ease-in-out data-closed:-translate-x-full min-[416px]:max-w-sm sm:px-6 sm:pb-10 dark:bg-zinc-950 dark:ring-zinc-800"
          >
            <MobileTabsSelect tabs={tabs} />
            <Navigation navigation={navigation} />
          </motion.div>
        </TransitionChild>
      </DialogPanel>
    </Dialog>
  )
}

export function useIsInsideMobileNavigation() {
  return useContext(IsInsideMobileNavigationContext)
}

export const useMobileNavigationStore = create<{
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}>()((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}))

export function MobileNavigation(arg0: {
  config: ClarifyConfig
  navigation: NavigationNode[]
  tabs?: NavigationTab[]
  routes: RouteItem[]
  currentLocale?: string
  currentRoute?: RouteItem
}) {  const {
  config,
  navigation,
  tabs,
  routes,
  currentLocale,
  currentRoute,
} = arg0

  const isInsideMobileNavigation = useIsInsideMobileNavigation()
  const { isOpen, toggle, close } = useMobileNavigationStore()
  const t = useBuiltInText()
  const ToggleIcon = isOpen ? XIcon : MenuIcon

  return (
    <IsInsideMobileNavigationContext.Provider value={true}>
      <button
        type="button"
        className="clarify-mobile-navigation-button clarify-ui-icon-button relative flex size-6 items-center justify-center rounded-(--clarify-theme-tokens-radius-md) transition"
        aria-label={t('navigation.toggle')}
        onClick={toggle}
      >
        <span className="absolute size-12 pointer-fine:hidden" />
        <ToggleIcon className="w-2.5 stroke-(--clarify-theme-tokens-colors-foreground) dark:stroke-white" />
      </button>
      {!isInsideMobileNavigation ? (
        <Suspense fallback={null}>
          <MobileNavigationDialog
            config={config}
            navigation={navigation}
            tabs={tabs}
            routes={routes}
            currentLocale={currentLocale}
            currentRoute={currentRoute}
            isOpen={isOpen}
            close={close}
          />
        </Suspense>
      ) : null}
    </IsInsideMobileNavigationContext.Provider>
  )
}
