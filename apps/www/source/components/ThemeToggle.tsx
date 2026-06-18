import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { MoonIcon, SunIcon } from './icons'

type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'

  const storedTheme = window.localStorage.getItem('clarify-www-theme')
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

export function ThemeToggle() {
  const { t } = useTranslation()
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem('clarify-www-theme', theme)
  }, [theme])

  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-white dark:focus-visible:bg-zinc-800/70"
      aria-label={t('theme.switchTo', { theme: t(`theme.${nextTheme}`) })}
      onClick={() => setTheme(nextTheme)}
    >
      <span className="dark:hidden"><MoonIcon /></span>
      <span className="hidden dark:block"><SunIcon /></span>
    </button>
  )
}
