import type { ReactNode } from 'react'

import { AppShell } from '../app/AppShell'
import { ConfigContext, OpenApiSpecsContext } from '../core/context'
import type { Config, NavigationTree, OpenApiRegistry, RouteItem } from '../core/types'
import type { RuntimeSlotRegistry } from '../slots'
import { ThemeProvider } from '../theme/ThemeProvider'
import { ThemeRoot } from '../theme/ThemeRoot'

export type ClarifyShellProps = {
  config: Config
  routes: RouteItem[]
  navigation?: NavigationTree
  openApiSpecs: OpenApiRegistry
  runtimeSlots?: RuntimeSlotRegistry
  themeEditor?: boolean
  children?: ReactNode
}

/**
 * Shared provider chain used by both client-side render and server-side
 * renderToHTML.  Wraps AppShell with ConfigContext → OpenApiSpecsContext →
 * ThemeProvider → ThemeRoot.
 *
 * The outer Router (BrowserRouter / StaticRouter) is left to the caller
 * so each entry point can supply the correct router variant.
 */
export function ClarifyShell(props: ClarifyShellProps) {
  const {
    config,
    routes,
    navigation,
    openApiSpecs,
    runtimeSlots,
    themeEditor = false,
  } = props
  return (
    <ConfigContext.Provider value={config}>
      <OpenApiSpecsContext.Provider value={openApiSpecs}>
        <ThemeProvider>
          <ThemeRoot theme={config.theme} themeEditor={themeEditor}>
            <AppShell
              config={config}
              routes={routes}
              navigation={navigation ?? { kind: 'flat', nodes: [] }}
              runtimeSlots={runtimeSlots}
            />
          </ThemeRoot>
        </ThemeProvider>
      </OpenApiSpecsContext.Provider>
    </ConfigContext.Provider>
  )
}
