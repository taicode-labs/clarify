import type { ComponentType, ReactNode } from 'react'

export type RouteRenderer = () => ReactNode

export function createRouteComponent(render: RouteRenderer): ComponentType {
  return function RouteComponent() {
    return render()
  }
}
