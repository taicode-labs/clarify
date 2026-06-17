import { useEffect, useState } from 'react'

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
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem('clarify-www-theme', theme)
  }, [theme])

  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-900/10 transition hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-800/50 dark:text-zinc-300 dark:ring-white/10 dark:hover:bg-zinc-800 dark:hover:text-white"
      aria-label={`Switch to ${nextTheme} theme`}
      onClick={() => setTheme(nextTheme)}
    >
      <span className="dark:hidden"><MoonIcon /></span>
      <span className="hidden dark:block"><SunIcon /></span>
    </button>
  )
}
