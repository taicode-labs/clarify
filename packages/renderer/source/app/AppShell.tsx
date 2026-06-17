import { motion } from 'framer-motion'
import { Link, Routes, Route, useLocation } from 'react-router-dom'

import { Logo } from '../components'
import { SectionProvider, type Section } from '../components/SectionProvider'
import { Header, Navigation } from '../shell'
import type { RouteItem, ClarifyConfig, NavigationNode } from '../types'

export type AppShellProps = {
  config: ClarifyConfig
  routes: RouteItem[]
  navigation: NavigationNode[]
}

function sectionsForPath(routes: RouteItem[], pathname: string): Section[] {
  const currentRoute = routes.find((route) => route.path === pathname || `/${route.path}` === pathname)

  return (
    currentRoute?.sections?.map((section) => ({
      id: section.id,
      title: section.title,
    })) ?? []
  )
}

export function AppShell(arg0: AppShellProps) {
  const { config, routes, navigation } = arg0
  const location = useLocation()
  const sections = sectionsForPath(routes, location.pathname)

  return (
    <SectionProvider sections={sections}>
      <div className="h-full min-h-screen bg-white lg:ml-72 xl:ml-80 dark:bg-zinc-900">
        <motion.header layoutScroll className="contents lg:pointer-events-none lg:fixed lg:inset-0 lg:z-40 lg:flex">
          <div className="contents lg:pointer-events-auto lg:block lg:w-72 lg:overflow-y-auto lg:border-r lg:border-zinc-900/10 lg:px-6 lg:pt-4 lg:pb-8 xl:w-80 lg:dark:border-white/10">
            <div className="hidden lg:flex">
              <Link to="/" aria-label="Home" className="flex items-center gap-2 no-underline">
                <Logo className="h-6" />
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">{config.title}</span>
              </Link>
            </div>
            <Header config={config} navigation={navigation} />
            <Navigation navigation={navigation} className="hidden lg:mt-10 lg:block" />
          </div>
        </motion.header>
        <div className="relative flex min-h-screen flex-col px-4 pt-14 sm:px-6 lg:px-8">
          <main className="flex-auto">
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
