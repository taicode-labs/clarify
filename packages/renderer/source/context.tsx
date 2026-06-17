import { createContext, useContext } from 'react'

import type { OpenAPISpec } from './openapi/utils'
import type { ClarifyConfig } from './types'

export const ClarifyConfigContext = createContext<ClarifyConfig | null>(null)
export const OpenApiSpecsContext = createContext<Record<string, OpenAPISpec>>({})

export function useClarifyConfig(): ClarifyConfig {
  const config = useContext(ClarifyConfigContext)
  if (!config) {
    throw new Error(
      '[clarify] useClarifyConfig must be used within a ClarifyConfigContext.Provider'
    )
  }
  return config
}

export function useOpenApiSpecs(): Record<string, OpenAPISpec> {
  return useContext(OpenApiSpecsContext)
}
