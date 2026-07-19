export function toPagefindLanguage(locale: string | undefined): string {
  const normalizedLocale = locale
    ?.trim()
    .replace(/_/g, '-')
    .split('-')
    .filter(Boolean)
    .join('-')
    // Pagefind's browser runtime lowercases the detected <html lang> value
    // before resolving the language-specific index. Keep Clarify's public
    // locale codes canonical (for example en-US / zh-CN), but use lowercase
    // BCP 47 tags internally so custom dev indexes match Pagefind runtime.
    .toLowerCase()

  return normalizedLocale || 'en'
}
