import { createContext, useContext, type ReactNode } from 'react'

import { ContentActions } from '../shell/ContentActions'
import type { RouteItem } from '../types'

type PageActionsContextValue = {
  route?: RouteItem
  routePrefix?: string
}

type PageActionsProviderProps = PageActionsContextValue & {
  children: ReactNode
}

const PageActionsContext = createContext<PageActionsContextValue>({})

export function PageActionsProvider(props: PageActionsProviderProps) {
  const { children, route, routePrefix } = props

  return (
    <PageActionsContext.Provider value={{ route, routePrefix }}>
      {children}
    </PageActionsContext.Provider>
  )
}

export function PageActions() {
  const { route, routePrefix } = useContext(PageActionsContext)

  return <ContentActions route={route} routePrefix={routePrefix} />
}
