import { createContext, useContext, type ReactNode } from 'react'

import type { UISlotName, SlotContext } from './types'

// Re-export slot types so internal modules can import from './context'.
export type { UISlotName, SlotContext }

const SlotContextValue = createContext<SlotContext | null>(null)

type SlotProviderProps = {
  value: SlotContext
  children: ReactNode
}

/**
 * Provides an isolated {@link SlotContext} for a single slot component.
 * `RuntimeSlot` wraps every rendered slot component with this provider.
 */
export function SlotProvider(arg0: SlotProviderProps): ReactNode {
  const { value, children } = arg0
  return <SlotContextValue.Provider value={value}>{children}</SlotContextValue.Provider>
}

/**
 * Reads the current slot context.
 *
 * Must be called inside a slot component (or a descendant). Calling it outside a
 * slot provider throws, which helps plugin authors notice that the component was
 * not mounted through a Clarify slot.
 */
export function useSlot(): SlotContext {
  const context = useContext(SlotContextValue)
  if (!context) {
    throw new Error('[clarify] useSlot must be called inside a slot component')
  }
  return context
}
