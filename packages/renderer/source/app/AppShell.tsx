import { Routes, Route, useLocation } from 'react-router-dom'

import { SectionProvider, type Section } from '../components/SectionProvider'
import { Sidebar, TopNav } from '../shell'
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
      <div className="flex min-h-screen flex-col">
        <TopNav config={config} />
        <div className="flex flex-1">
          <Sidebar navigation={navigation} />
          <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10 dark:bg-zinc-900">
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
