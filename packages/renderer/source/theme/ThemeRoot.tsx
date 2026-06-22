import { useEffect, useMemo } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import type { ClarifyThemeConfig } from '../types'

import { ThemeEditor } from './ThemeEditor'

type ThemeCssVariables = CSSProperties & Record<`--clarify-theme-${string}`, string>

type ThemeRootProps = {
  children: ReactNode
  theme: ClarifyThemeConfig
  themeEditor?: boolean
}

function themeToCssVariables(theme: ClarifyThemeConfig): ThemeCssVariables {
  const { colors, radius } = theme.tokens

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
    '--clarify-theme-layout-max-width': theme.layout.maxWidth,
  }
}

function applyRootThemeVariables(themeVariables: ThemeCssVariables): () => void {
  const rootStyle = document.documentElement.style

  for (const [property, value] of Object.entries(themeVariables)) {
    rootStyle.setProperty(property, value)
  }

  return () => {
    for (const property of Object.keys(themeVariables)) {
      rootStyle.removeProperty(property)
    }
  }
}

export function ThemeRoot(props: ThemeRootProps) {
  const { children, theme, themeEditor = false } = props
  const themeVariables = useMemo(() => themeToCssVariables(theme), [theme])

  useEffect(() => applyRootThemeVariables(themeVariables), [themeVariables])

  return (
    <div
      className="clarify-app h-full min-h-screen bg-(--clarify-theme-tokens-colors-background) text-(--clarify-theme-tokens-colors-foreground) dark:bg-zinc-950 dark:text-white"
      data-theme-preset={theme.preset}
      style={themeVariables}
    >
      {children}
      {themeEditor ? <ThemeEditor initialTheme={theme} /> : null}
    </div>
  )
}
