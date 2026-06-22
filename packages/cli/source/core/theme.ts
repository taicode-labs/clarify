import type { ClarifyThemeConfig, ClarifyThemePreset, ResolvedClarifyThemeConfig } from '../types.js'

export const clarifyThemePresets = {
  default: {
    preset: 'default',
    tokens: {
      colors: {
        primary: '#047857',
        accent: '#0D9488',
        background: '#ffffff',
        foreground: '#111827',
        surface: '#ffffff',
        muted: '#64748b',
        border: 'rgb(15 23 42 / 0.12)',
        codeBackground: '#f6fbf8',
      },
      radius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
      },
    },
    layout: {
      maxWidth: '82rem',
    },
    editor: false,
  },
  base: {
    preset: 'base',
    tokens: {
      colors: {
        primary: '#18181b',
        accent: '#52525b',
        background: '#ffffff',
        foreground: '#18181b',
        surface: '#ffffff',
        muted: '#71717a',
        border: 'rgb(24 24 27 / 0.12)',
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
    editor: false,
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
    editor: theme.editor ?? presetTheme.editor,
  }
}
