import { Routes, Route, NavLink, useLocation } from 'react-router-dom'

import type { RouteItem, ClarifyConfig, NavigationNode, ClarifyLogoConfig } from './types'

export type AppShellProps = {
  config: ClarifyConfig
  routes: RouteItem[]
  navigation: NavigationNode[]
}

function resolveLogoUrl(logo?: ClarifyLogoConfig): string | undefined {
  if (typeof logo === 'string') return logo
  if (logo && typeof logo === 'object') return logo.light ?? logo.dark
  return undefined
}

function TopNav(arg0: { config: ClarifyConfig }) {
  const { config } = arg0
  const logoUrl = resolveLogoUrl(config.logo)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex h-14 items-center px-4 md:px-6">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-bold text-slate-900 no-underline">
          {logoUrl ? <img src={logoUrl} alt="" className="h-6 w-6" /> : null}
          <span>{config.title}</span>
        </NavLink>
      </div>
    </header>
  )
}

function SidebarItem(arg0: { node: NavigationNode; depth?: number }) {
  const { node, depth = 0 } = arg0
  const location = useLocation()

  const hasChildren = (node.children?.length ?? 0) > 0
  const hasSections = (node.sections?.length ?? 0) > 0
  const isCurrentPage = location.pathname === node.path

  return (
    <li>
      <NavLink
        to={node.path}
        className={({ isActive }) =>
          `block rounded-md px-3 py-1.5 text-sm transition-colors ${isActive ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`
        }
        style={{ paddingLeft: `${0.75 + depth * 0.75}rem` }}
      >
        {node.title}
      </NavLink>
      {isCurrentPage && hasSections ? (
        <ul className="mt-0.5 space-y-0.5">
          {node.sections!.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="block rounded-md px-3 py-1 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                style={{ paddingLeft: `${0.75 + (depth + 1) * 0.75}rem` }}
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {hasChildren ? (
        <ul className="mt-0.5 space-y-0.5">
          {node.children!.map((child) => (
            <SidebarItem key={child.path} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function Sidebar(arg0: { navigation: NavigationNode[] }) {
  const { navigation } = arg0

  return (
    <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-slate-200 bg-white md:block">
      <nav className="p-3">
        <ul className="space-y-0.5">
          {navigation.map((node) => (
            <SidebarItem key={node.path} node={node} />
          ))}
        </ul>
      </nav>
    </aside>
  )
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
