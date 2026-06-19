import type { ClarifyThemeConfig, ClarifyThemePreset, ResolvedClarifyThemeConfig } from '../types.js'

export const clarifyThemePresets = {
  default: {
    preset: 'default',
    tokens: {
      colors: {
        primary: '#10b981',
        accent: '#059669',
        background: '#ffffff',
        foreground: '#18181b',
        surface: '#ffffff',
        muted: '#71717a',
        border: 'rgb(24 24 27 / 0.1)',
        codeBackground: '#f4f4f5',
      },
      radius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
    layout: {
      maxWidth: '80rem',
    },
  },
  mint: {
    preset: 'mint',
    tokens: {
      colors: {
        primary: '#10b981',
        accent: '#14b8a6',
        background: '#ffffff',
        foreground: '#0f172a',
        surface: '#ffffff',
        muted: '#64748b',
        border: '#e2e8f0',
        codeBackground: '#f8fafc',
      },
      radius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
    layout: {
      maxWidth: '80rem',
    },
  },
  violet: {
    preset: 'violet',
    tokens: {
      colors: {
        primary: '#8b5cf6',
        accent: '#a78bfa',
        background: '#ffffff',
        foreground: '#0f172a',
        surface: '#ffffff',
        muted: '#64748b',
        border: '#e2e8f0',
        codeBackground: '#f8fafc',
      },
      radius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
    layout: {
      maxWidth: '80rem',
    },
  },
} as const satisfies Record<ClarifyThemePreset, ResolvedClarifyThemeConfig>

export function resolveThemeConfig(theme: ClarifyThemeConfig = {}): ResolvedClarifyThemeConfig {
  const preset = theme.preset ?? 'default'
  const presetTheme = clarifyThemePresets[preset]

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
