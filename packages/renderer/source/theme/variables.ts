import type { CSSProperties } from 'react'

import type { ClarifyThemeConfig, ClarifyThemePreset } from '../types'

export type ThemeCssVariables = CSSProperties & Record<`--clarify-theme-${string}`, string>

export type ThemeVariableTarget = HTMLElement | string

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
} satisfies Record<ClarifyThemePreset, ClarifyThemeConfig>

export function cloneTheme(theme: ClarifyThemeConfig): ClarifyThemeConfig {
  return {
    preset: theme.preset,
    tokens: {
      colors: { ...theme.tokens.colors },
      radius: { ...theme.tokens.radius },
    },
    layout: { ...theme.layout },
    editor: theme.editor,
  }
}

function matchesPresetTheme(theme: ClarifyThemeConfig): boolean {
  const preset = clarifyThemePresets[theme.preset]

  return JSON.stringify({ tokens: theme.tokens, layout: theme.layout }) === JSON.stringify({ tokens: preset.tokens, layout: preset.layout })
}

function effectiveTheme(theme: ClarifyThemeConfig, resolvedTheme?: 'light' | 'dark'): ClarifyThemeConfig {
  if (resolvedTheme !== 'dark' || !matchesPresetTheme(theme)) return theme

  return {
    ...theme,
    tokens: {
      ...theme.tokens,
      colors: {
        ...theme.tokens.colors,
        background: '#09090b',
        foreground: '#ffffff',
        surface: '#18181b',
        muted: '#a1a1aa',
        border: 'rgb(255 255 255 / 0.1)',
        codeBackground: '#18181b',
      },
    },
  }
}

export function themeToCssVariables(theme: ClarifyThemeConfig, resolvedTheme?: 'light' | 'dark'): ThemeCssVariables {
  const resolved = effectiveTheme(theme, resolvedTheme)
  const { colors, radius } = resolved.tokens

  return {
    '--clarify-theme-tokens-colors-primary': colors.primary,
    '--clarify-theme-tokens-colors-accent': colors.accent,
    '--clarify-theme-tokens-colors-background': colors.background,
    '--clarify-theme-tokens-colors-foreground': colors.foreground,
    '--clarify-theme-tokens-colors-surface': colors.surface,
    '--clarify-theme-tokens-colors-muted': colors.muted,
    '--clarify-theme-tokens-colors-border': colors.border,
    '--clarify-theme-tokens-colors-code-background': colors.codeBackground,
    '--clarify-theme-tokens-radius-sm': radius.sm,
    '--clarify-theme-tokens-radius-md': radius.md,
    '--clarify-theme-tokens-radius-lg': radius.lg,
    '--clarify-theme-tokens-radius-xl': radius.xl,
    '--clarify-theme-layout-max-width': resolved.layout.maxWidth,
  }
}

function uniqueElements(elements: HTMLElement[]): HTMLElement[] {
  return Array.from(new Set(elements))
}

export function resolveThemeVariableTargets(target?: ThemeVariableTarget): HTMLElement[] {
  if (typeof document === 'undefined') return []

  if (target instanceof HTMLElement) return [target]

  if (typeof target === 'string') {
    return Array.from(document.querySelectorAll<HTMLElement>(target))
  }

  return uniqueElements([
    document.documentElement,
    ...Array.from(document.querySelectorAll<HTMLElement>('.clarify-app')),
  ])
}

export function applyThemeCssVariables(variables: ThemeCssVariables, targets: HTMLElement[]): () => void {
  const previousValues = new Map<HTMLElement, Map<string, string>>()

  for (const element of targets) {
    const elementPreviousValues = new Map<string, string>()

    for (const [property, value] of Object.entries(variables)) {
      elementPreviousValues.set(property, element.style.getPropertyValue(property))
      element.style.setProperty(property, value)
    }

    previousValues.set(element, elementPreviousValues)
  }

  return () => {
    for (const [element, elementPreviousValues] of previousValues) {
      for (const [property, previousValue] of elementPreviousValues) {
        if (previousValue) {
          element.style.setProperty(property, previousValue)
        } else {
          element.style.removeProperty(property)
        }
      }
    }
  }
}
