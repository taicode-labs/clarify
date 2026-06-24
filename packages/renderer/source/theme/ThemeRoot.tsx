import { useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'

import type { ClarifyThemeConfig } from '../types'

import { ThemeEditor } from './ThemeEditor'
import { useTheme } from './ThemeProvider'
import { applyThemeCssVariables, resolveThemeVariableTargets, themeToCssVariables } from './variables'

type ThemeRootProps = {
  children: ReactNode
  theme: ClarifyThemeConfig
  themeEditor?: boolean
}

export function ThemeRoot(props: ThemeRootProps) {
  const { children, theme, themeEditor = false } = props
  const { resolvedTheme } = useTheme()
  const themeVariables = useMemo(() => themeToCssVariables(theme, resolvedTheme), [resolvedTheme, theme])

  useEffect(() => applyThemeCssVariables(themeVariables, resolveThemeVariableTargets(':root')), [themeVariables])

  return (
    <div
      className="clarify-app h-full min-h-screen bg-(--clarify-theme-tokens-colors-background) text-(--clarify-theme-tokens-colors-foreground)"
      data-theme-preset={theme.preset}
    >
      {children}
      {themeEditor ? <ThemeEditor initialTheme={theme} /> : null}
    </div>
  )
}
