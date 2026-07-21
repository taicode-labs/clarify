import { useContext } from 'react'

import { ConfigContext, LocaleContext } from './context'
import enText from './locales/en.json'
import zhCNText from './locales/zh-CN.json'

export type BuiltInLocale = 'en' | 'zh-CN'

export type BuiltInTextKey = keyof typeof enText

const checkedZhCNText: Record<BuiltInTextKey, string> & Record<Exclude<keyof typeof zhCNText, BuiltInTextKey>, never> = zhCNText

const builtInText: Record<BuiltInLocale, Record<BuiltInTextKey, string>> = {
  en: enText,
  'zh-CN': checkedZhCNText,
}

export function resolveBuiltInLocale(locale?: string): BuiltInLocale {
  return locale === 'zh-CN' || locale?.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

export function translateBuiltInText(locale: string | undefined, key: BuiltInTextKey, replacements: Record<string, string> = {}): string {
  let value = builtInText[resolveBuiltInLocale(locale)]?.[key] ?? builtInText.en[key]
  for (const [name, replacement] of Object.entries(replacements)) {
    value = value.replaceAll(`{${name}}`, replacement)
  }
  return value
}

export function useBuiltInText(locale?: string) {
  const config = useContext(ConfigContext)
  const currentLocale = useContext(LocaleContext)
  const resolvedLocale = locale ?? currentLocale ?? config?.locales?.default
  return (key: BuiltInTextKey, replacements?: Record<string, string>) => translateBuiltInText(resolvedLocale, key, replacements)
}
