import type { LocalizedText } from '../core/types'

/**
 * Resolve a localized text value for the given locale.
 * Falls back to the fallback locale, then the first available value,
 * then an empty string.
 */
export function resolveLocalizedText(text: LocalizedText, locale?: string, fallbackLocale?: string): string {
  if (typeof text === 'string') return text
  return (locale ? text[locale] : undefined)
    ?? (fallbackLocale ? text[fallbackLocale] : undefined)
    ?? Object.values(text)[0]
    ?? ''
}
