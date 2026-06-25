import { createContext, lazy, Suspense, useContext, type ComponentType, type ReactNode } from 'react'

import { useLocale } from '../core/context'
import type { RouteItem } from '../core/types'

import { ClarifySlotProvider, type ClarifyUISlotName } from './context'

/**
 * One registered slot component, as compiled by the CLI into
 * `virtual:clarify/slots`.
 *
 * `component` is a lazy import factory `() => import('path')`. On the client
 * it is passed to `React.lazy`. During SSR the factory is pre-resolved and
 * the resulting component is stored in `_resolved`, which the renderer uses
 * directly (no Suspense needed for `renderToString`).
 */
export type RuntimeSlotEntry = {
  /** Plugin that registered this component, used as a stable render key. */
  plugin: string
  /** Lazy import factory — `() => import('path')`. Set by CLI virtual module. */
  component: () => Promise<{ default: ComponentType }>
  /** @internal Pre-resolved component set by SSR before {@link renderToHTML}. */
  _resolved?: ComponentType
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
 * Each component is loaded via the import factory. If `_resolved` is set
 * (SSR pre-resolution), the component is rendered synchronously for
 * compatibility with `renderToString`. Otherwise, `React.lazy` + `Suspense`
 * is used for client-side code-splitting.
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
    return (
      <ClarifySlotProvider
        value={{ name, plugin: lastEntry.plugin, route, locale, DefaultComponent }}
      >
        <SlotEntryRenderer entry={lastEntry} />
      </ClarifySlotProvider>
    )
  }

  // Extension slot (*.before/*.after): render all entries
  return (
    <>
      {entries.map((entry) => (
        <ClarifySlotProvider
          key={`${name}:${entry.plugin}`}
          value={{ name, plugin: entry.plugin, route, locale }}
        >
          <SlotEntryRenderer entry={entry} />
        </ClarifySlotProvider>
      ))}
    </>
  )
}

// ---- internal helpers ----

function SlotEntryRenderer({ entry }: { entry: RuntimeSlotEntry }): ReactNode {
  // SSR pre-resolved component — render synchronously (no Suspense needed)
  if (entry._resolved) {
    const Component = entry._resolved
    return <Component />
  }

  // Client: lazy-load with code-splitting
  const Component = lazy(entry.component)
  return (
    <Suspense fallback={null}>
      <Component />
    </Suspense>
  )
}
