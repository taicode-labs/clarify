import { themePresets } from '@clarify-labs/renderer'

import type { ClarifyThemeConfig, ResolvedClarifyThemeConfig } from '../types.js'

export { themePresets }

export function resolveThemeConfig(theme: ClarifyThemeConfig = {}): ResolvedClarifyThemeConfig {
  const preset = theme.preset ?? 'default'
  const presetTheme = themePresets[preset] as ResolvedClarifyThemeConfig

  return {
    preset,
    tokens: {
      colors: {
        ...presetTheme.tokens.colors,
        ...theme.tokens?.colors,
      },
      radius: {
        ...presetTheme.tokens.radius,
        ...theme.tokens?.radius,
      },
    },
    layout: {
      ...presetTheme.layout,
      ...theme.layout,
    },
  }
}
