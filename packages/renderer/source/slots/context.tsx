import { createContext, useContext, type ComponentType, type ReactNode } from 'react'

import type { RouteItem } from '../core/types'

/**
 * Runtime UI slot names.
 *
 * The name follows the dot-path convention documented in the plugin design:
 * `${scope}.${path}.${position}`. Keeping the union here (instead of a bare
 * string) gives slot consumers and the generated `clarify-env.d.ts` a single
 * source of truth.
 */
export type ClarifyUISlotName = 'page.footer.before' | 'page.banner.replace' | 'page.footer.replace'

/**
 * Context exposed to a slot component through {@link useClarifySlot}.
 *
 * Slot components never receive Clarify context through props. Instead they read
 * everything they need from this hook, which keeps slot components as ordinary
 * React components and lets the slot context grow without changing signatures.
 */
export type ClarifySlotContext = {
  /** The slot the current component is mounted into. */
  name: ClarifyUISlotName
  /** Name of the plugin that registered the current slot component. */
  plugin: string
  /** Current route, when a content route is active. */
  route?: RouteItem
  /** Current locale, for example `zh-CN` or `en-US`. */
  locale?: string
  /**
   * Built-in default component for replacement slots. Only provided for
   * `*.replace` slots (Phase 4); undefined for extension slots.
   */
  DefaultComponent?: ComponentType
}

const SlotContext = createContext<ClarifySlotContext | null>(null)

type ClarifySlotProviderProps = {
  value: ClarifySlotContext
  children: ReactNode
}

/**
 * Provides an isolated {@link ClarifySlotContext} for a single slot component.
 * `RuntimeSlot` wraps every rendered slot component with this provider.
 */
export function ClarifySlotProvider(arg0: ClarifySlotProviderProps): ReactNode {
  const { value, children } = arg0
  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>
}

/**
 * Reads the current slot context.
 *
 * Must be called inside a slot component (or a descendant). Calling it outside a
 * slot provider throws, which helps plugin authors notice that the component was
 * not mounted through a Clarify slot.
 */
export function useClarifySlot(): ClarifySlotContext {
  const context = useContext(SlotContext)
  if (!context) {
    throw new Error('[clarify] useClarifySlot must be called inside a Clarify slot component')
  }
  return context
}
