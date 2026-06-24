import { createContext, useContext } from 'react'

import type { OpenAPISpec } from '../openapi/lib/utils'

import type { Config } from './types'

export const ConfigContext = createContext<Config | null>(null)
export const LocaleContext = createContext<string | undefined>(undefined)
export const OpenApisContext = createContext<Record<string, OpenAPISpec>>({})

export function useConfig(): Config {
  const config = useContext(ConfigContext)
  if (!config) {
    throw new Error(
      '[clarify] useConfig must be used within a ConfigContext.Provider'
    )
  }
  return config
}

export function useLocale(): string | undefined {
  return useContext(LocaleContext)
}

export function useOpenApis(): Record<string, OpenAPISpec> {
  return useContext(OpenApisContext)
}
