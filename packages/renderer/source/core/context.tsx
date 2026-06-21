import { createContext, useContext } from 'react'

import type { OpenAPISpec } from '../openapi/lib/utils'

import type { ClarifyConfig } from './types'

export const ClarifyConfigContext = createContext<ClarifyConfig | null>(null)
export const ClarifyLocaleContext = createContext<string | undefined>(undefined)
export const OpenApisContext = createContext<Record<string, OpenAPISpec>>({})

export function useClarifyConfig(): ClarifyConfig {
  const config = useContext(ClarifyConfigContext)
  if (!config) {
    throw new Error(
      '[clarify] useClarifyConfig must be used within a ClarifyConfigContext.Provider'
    )
  }
  return config
}

export function useClarifyLocale(): string | undefined {
  return useContext(ClarifyLocaleContext)
}

export function useOpenApis(): Record<string, OpenAPISpec> {
  return useContext(OpenApisContext)
}
