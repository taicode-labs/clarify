import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

import type { Config, OpenApiRegistry } from './types'

export const ConfigContext = createContext<Config | null>(null)
export type ConfigUpdater = (update: Config | ((config: Config) => Config)) => void
const ConfigUpdaterContext = createContext<ConfigUpdater | null>(null)
export const LocaleContext = createContext<string | undefined>(undefined)
export const OpenApiSpecsContext = createContext<OpenApiRegistry>({})

export type ConfigProviderProps = {
  config: Config
  children: ReactNode
}

export function ConfigProvider(props: ConfigProviderProps) {
  const { config: initialConfig, children } = props
  const [config, setConfig] = useState(initialConfig)

  return (
    <ConfigContext.Provider value={config}>
      <ConfigUpdaterContext.Provider value={setConfig}>
        {children}
      </ConfigUpdaterContext.Provider>
    </ConfigContext.Provider>
  )
}

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

export function useConfigUpdater(): ConfigUpdater {
  const updater = useContext(ConfigUpdaterContext)
  if (!updater) {
    throw new Error('[clarify] useConfigUpdater must be used within a ConfigProvider')
  }
  return updater
}

export function useConfigUpdaterOptional(): ConfigUpdater | null {
  return useContext(ConfigUpdaterContext)
}

export function useLocale(): string | undefined {
  return useContext(LocaleContext)
}

export function useOpenApiSpecs(): OpenApiRegistry {
  return useContext(OpenApiSpecsContext)
}
