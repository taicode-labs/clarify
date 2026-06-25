import { createContext, useContext, type ComponentType, type ReactNode } from 'react'

import { useLocale } from '../core/context'
import type { RouteItem } from '../core/types'

import { ClarifySlotProvider, type ClarifyUISlotName } from './context'

/**
 * One registered slot component, as compiled by the CLI into
 * `virtual:clarify-runtime-slots`.
 */
export type RuntimeSlotEntry = {
  /** Plugin that registered this component, used as a stable render key. */
  plugin: string
  /** The already-imported React component to render. */
  component: ComponentType
}

/** Registry keyed by slot name. */
export type RuntimeSlots = Partial<Record<ClarifyUISlotName, RuntimeSlotEntry[]>>

type RuntimeSlotsContextValue = {
  slots: RuntimeSlots
  route?: RouteItem
}

export const RuntimeSlotsContext = createContext<RuntimeSlotsContextValue>({ slots: {} })

type RuntimeSlotsProviderProps = {
  slots?: RuntimeSlots
  route?: RouteItem
  children: ReactNode
}

/**
 * Makes the compiled slot registry and the current route available to every
 * {@link RuntimeSlot} in the tree. Mounted once near the top of `AppShell`.
 */
export function RuntimeSlotsProvider(arg0: RuntimeSlotsProviderProps): ReactNode {
  const { slots, route, children } = arg0
  return (
    <RuntimeSlotsContext.Provider value={{ slots: slots ?? {}, route }}>
      {children}
    </RuntimeSlotsContext.Provider>
  )
}

type RuntimeSlotProps = {
  name: ClarifyUISlotName
  /** Built-in default component for replacement slots. */
  default?: ComponentType
}

/**
 * Renders plugin components registered for a slot, in registration order.
 *
 * For extension slots (*.before/*.after), renders all plugin components.
 * For replacement slots (*.replace), renders only the last registered plugin
 * component (if any), and passes the default component through context.
 *
 * Each component is wrapped in its own slot context provider.
 */
export function RuntimeSlot(arg0: RuntimeSlotProps): ReactNode {
  const { name, default: DefaultComponent } = arg0
  const { slots, route } = useContext(RuntimeSlotsContext)
  const locale = useLocale()

  const entries = slots[name]
  if (!entries || entries.length === 0) {
    return DefaultComponent ? <DefaultComponent /> : null
  }

  const isReplaceSlot = name.endsWith('.replace')
  if (isReplaceSlot) {
    const lastEntry = entries[entries.length - 1]
    const Component = lastEntry.component
    return (
      <ClarifySlotProvider
        value={{ name, plugin: lastEntry.plugin, route, locale, DefaultComponent }}
      >
        <Component />
      </ClarifySlotProvider>
    )
  }

  // Extension slot (*.before/*.after): render all entries
  return (
    <>
      {entries.map((entry) => {
        const Component = entry.component
        return (
          <ClarifySlotProvider
            key={`${name}:${entry.plugin}`}
            value={{ name, plugin: entry.plugin, route, locale }}
          >
            <Component />
          </ClarifySlotProvider>
        )
      })}
    </>
  )
}
