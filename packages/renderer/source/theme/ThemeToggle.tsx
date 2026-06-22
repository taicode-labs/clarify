import { Moon, Sun } from 'lucide-react'

import { useBuiltInText } from '../core/i18n'

import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const t = useBuiltInText()
  const otherTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      className="clarify-theme-toggle relative flex size-8 items-center justify-center rounded-(--clarify-theme-tokens-radius-md) transition hover:bg-(--clarify-ui-hover-background)"
      aria-label={otherTheme === 'dark' ? t('theme.switchToDark') : t('theme.switchToLight')}
      onClick={() => setTheme(otherTheme)}
    >
      <span className="absolute size-12 pointer-fine:hidden" />
      <Sun className="h-5 w-5 stroke-(--clarify-theme-tokens-colors-foreground) dark:hidden" />
      <Moon className="hidden h-5 w-5 stroke-white dark:block" />
    </button>
  )
}
