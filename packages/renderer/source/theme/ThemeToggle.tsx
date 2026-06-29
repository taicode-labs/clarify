import { Monitor, Moon, Sun } from 'lucide-react'

import { useBuiltInText } from '../core/i18n'

import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const t = useBuiltInText()
  const nextTheme = getNextTheme(theme)
  const label = getThemeLabel(nextTheme, t)

  return (
    <button
      type="button"
      className="clarify-theme-toggle relative flex size-8 items-center justify-center rounded-(--clarify-theme-tokens-radius-md) transition hover:bg-(--clarify-ui-hover-background)"
      aria-label={label}
      title={label}
      onClick={() => setTheme(nextTheme)}
    >
      <span className="absolute size-12 pointer-fine:hidden" />
      {theme === 'system' ? <Monitor className="h-5 w-5 stroke-(--clarify-theme-tokens-colors-foreground)" /> : null}
      {theme === 'light' ? <Sun className="h-5 w-5 stroke-(--clarify-theme-tokens-colors-foreground)" /> : null}
      {theme === 'dark' ? <Moon className="h-5 w-5 stroke-white" /> : null}
    </button>
  )
}

function getNextTheme(theme: 'light' | 'dark' | 'system') {
  if (theme === 'system') return 'light'
  if (theme === 'light') return 'dark'
  return 'system'
}

function getThemeLabel(theme: 'light' | 'dark' | 'system', t: ReturnType<typeof useBuiltInText>) {
  if (theme === 'dark') return t('theme.switchToDark')
  if (theme === 'light') return t('theme.switchToLight')
  return t('theme.switchToSystem')
}
