import type { ReactNode } from 'react'

import { AppShell } from '../app/AppShell'
import { ConfigContext, OpenApisContext } from '../core/context'
import type { Config, NavigationTree, OpenAPISpec, RouteItem, RuntimeSlots } from '../core/types'
import { ThemeProvider } from '../theme/ThemeProvider'
import { ThemeRoot } from '../theme/ThemeRoot'

export type ClarifyShellProps = {
  config: Config
  routes: RouteItem[]
  navigation?: NavigationTree
  openApis: Record<string, OpenAPISpec>
  runtimeSlots?: RuntimeSlots
  themeEditor?: boolean
  children?: ReactNode
}

/**
 * Shared provider chain used by both client-side render and server-side
 * renderToHTML.  Wraps AppShell with ConfigContext → OpenApisContext →
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
    openApis,
    runtimeSlots,
    themeEditor = false,
  } = props
  return (
    <ConfigContext.Provider value={config}>
      <OpenApisContext.Provider value={openApis}>
        <ThemeProvider>
          <ThemeRoot theme={config.theme} themeEditor={themeEditor}>
            <AppShell
              config={config}
              routes={routes}
              navigation={navigation ?? []}
              runtimeSlots={runtimeSlots}
            />
          </ThemeRoot>
        </ThemeProvider>
      </OpenApisContext.Provider>
    </ConfigContext.Provider>
  )
}
