export const locales = ['en', 'zh-CN'] as const
export type AppLocale = (typeof locales)[number]

export const localeLabels: Record<AppLocale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
}

export function isAppLocale(locale: string): locale is AppLocale {
  return (locales as readonly string[]).includes(locale)
}
