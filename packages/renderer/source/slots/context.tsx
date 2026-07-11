import { createContext, useContext, type ReactNode } from 'react'

import type { UISlotName, UISlotContext } from './types'

// Re-export slot types so internal modules can import from './context'.
export type { UISlotName, UISlotContext }

const UISlotContextValue = createContext<UISlotContext | null>(null)

type SlotProviderProps = {
  value: UISlotContext
  children: ReactNode
}

/**
 * Provides an isolated {@link UISlotContext} for a single slot component.
 * `RuntimeSlot` wraps every rendered slot component with this provider.
 */
export function SlotProvider(arg0: SlotProviderProps): ReactNode {
  const { value, children } = arg0
  return <UISlotContextValue.Provider value={value}>{children}</UISlotContextValue.Provider>
}

/**
 * Reads the current slot context.
 *
 * Must be called inside a slot component (or a descendant). Calling it outside a
 * slot provider throws, which helps plugin authors notice that the component was
 * not mounted through a Clarify slot.
 */
export function useSlot(): UISlotContext {
  const context = useContext(UISlotContextValue)
  if (!context) {
    throw new Error('[clarify] useSlot must be called inside a slot component')
  }
  return context
}
