import type { ContentRoute, ResolvedClarifyI18nConfig } from '../types.js'

export function mdxRoute(route: Omit<ContentRoute, 'kind'>): ContentRoute {
  return { ...route, kind: 'mdx' }
}

export const testI18n: ResolvedClarifyI18nConfig = {
  defaultLocale: 'zh-CN',
  missing: 'fallback',
  locales: [
    { code: 'zh-CN', label: '简体中文' },
    { code: 'en-US', label: 'English' },
  ],
}
