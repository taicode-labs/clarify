import type { ComponentType } from 'react'
import { Routes, Route } from 'react-router-dom'
import type { RouteItem, ClarifyConfig } from './types'

export type AppShellProps = {
  config: ClarifyConfig
  routes: RouteItem[]
}

export function AppShell({ routes }: AppShellProps) {
  return (
    <Routes>
      {routes.map((route) => (
        <Route key={route.path} path={route.path} element={<route.component />} />
      ))}
    </Routes>
  )
}
