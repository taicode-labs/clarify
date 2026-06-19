import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react'
import { motion } from 'framer-motion'
import { createContext, Suspense, useContext } from 'react'
import { create } from 'zustand'

import type { ClarifyConfig, NavigationNode, RouteItem } from '../types'

import { Header } from './Header'
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

function MobileNavigationDialog(arg0: {
  config: ClarifyConfig
  isOpen: boolean
  navigation: NavigationNode[]
  routes: RouteItem[]
  currentLocale?: string
  currentRoute?: RouteItem
  close: () => void
}) {  const {
  config,
  isOpen,
  navigation,
  routes,
  currentLocale,
  currentRoute,
  close,
} = arg0

  return (
    <Dialog transition open={isOpen} onClose={close} className="clarify-mobile-navigation-dialog fixed inset-0 z-50 lg:hidden">
      <DialogBackdrop
        transition
        className="clarify-mobile-navigation-backdrop fixed inset-0 top-14 bg-[color-mix(in_srgb,var(--clarify-theme-tokens-colors-muted)_20%,transparent)] backdrop-blur-xs data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in dark:bg-black/40"
      />

      <DialogPanel>
        <TransitionChild>
          <Header
            config={config}
            navigation={navigation}
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
  routes: RouteItem[]
  currentLocale?: string
  currentRoute?: RouteItem
}) {  const {
  config,
  navigation,
  routes,
  currentLocale,
  currentRoute,
} = arg0

  const isInsideMobileNavigation = useIsInsideMobileNavigation()
  const { isOpen, toggle, close } = useMobileNavigationStore()
  const ToggleIcon = isOpen ? XIcon : MenuIcon

  return (
    <IsInsideMobileNavigationContext.Provider value={true}>
      <button
        type="button"
        className="clarify-mobile-navigation-button relative flex size-6 items-center justify-center rounded-(--clarify-theme-tokens-radius-md) transition hover:bg-[color-mix(in_srgb,var(--clarify-theme-tokens-colors-foreground)_5%,transparent)] dark:hover:bg-white/5"
        aria-label="Toggle navigation"
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
