import { createContext, useContext } from 'react'

import type { Config, OpenApiRegistry } from './types'

export const ConfigContext = createContext<Config | null>(null)
export const LocaleContext = createContext<string | undefined>(undefined)
export const OpenApiSpecsContext = createContext<OpenApiRegistry>({})

export function useConfig(): Config {
  const config = useContext(ConfigContext)
  if (!config) {
    throw new Error(
      '[clarify] useConfig must be used within a ConfigContext.Provider'
    )
  }
  return config
}

export function useConfigOptional(): Config | null {
  return useContext(ConfigContext)
}

export function useLocale(): string | undefined {
  return useContext(LocaleContext)
}

export function useOpenApiSpecs(): OpenApiRegistry {
  return useContext(OpenApiSpecsContext)
}
