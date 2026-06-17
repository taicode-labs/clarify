import { createContext, useContext } from 'react'
import type { ClarifyConfig } from './types'

export const ClarifyConfigContext = createContext<ClarifyConfig | null>(null)

export function useClarifyConfig(): ClarifyConfig {
  const config = useContext(ClarifyConfigContext)
  if (!config) {
    throw new Error(
      '[clarify] useClarifyConfig must be used within a ClarifyConfigContext.Provider'
    )
  }
  return config
}
