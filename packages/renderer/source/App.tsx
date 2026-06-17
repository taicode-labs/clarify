import { Routes, Route } from 'react-router-dom'

import { Sidebar, TopNav } from './shell'
import type { RouteItem, ClarifyConfig, NavigationNode } from './types'

export type AppShellProps = {
  config: ClarifyConfig
  routes: RouteItem[]
  navigation: NavigationNode[]
}

export function AppShell(arg0: AppShellProps) {
  const { config, routes, navigation } = arg0

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav config={config} />
      <div className="flex flex-1">
        <Sidebar navigation={navigation} />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10">
          <Routes>
            {routes.map((route) => (
              <Route key={route.path} path={route.path} element={<route.component />} />
            ))}
          </Routes>
        </main>
      </div>
    </div>
  )
}
