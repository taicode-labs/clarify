import type { ClarifyThemePreset, ResolvedClarifyThemeConfig } from '../types.js'

export const clarifyThemePresets = {
  default: {
    preset: 'default',
    primary: '#0ea5e9',
  },
  mint: {
    preset: 'mint',
    primary: '#10b981',
  },
  violet: {
    preset: 'violet',
    primary: '#8b5cf6',
  },
} as const satisfies Record<ClarifyThemePreset, ResolvedClarifyThemeConfig>

export function resolveThemeConfig(theme: { preset?: ClarifyThemePreset; primary?: string } = {}): ResolvedClarifyThemeConfig {
  const preset = theme.preset ?? 'default'

  return {
    ...clarifyThemePresets[preset],
    ...theme,
    preset,
  }
}
