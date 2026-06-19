import type { ComponentPropsWithoutRef } from 'react'

import { useBuiltInText } from '../i18n'

import { useTheme } from './ThemeProvider'

function SunIcon(props: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path d="M12.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
      <path
        strokeLinecap="round"
        d="M10 5.5v-1M13.182 6.818l.707-.707M14.5 10h1M13.182 13.182l.707.707M10 15.5v-1M6.11 13.889l.708-.707M4.5 10h1M6.11 6.111l.708.707"
      />
    </svg>
  )
}

function MoonIcon(props: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path d="M15.224 11.724a5.5 5.5 0 0 1-6.949-6.949 5.5 5.5 0 1 0 6.949 6.949Z" />
    </svg>
  )
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const t = useBuiltInText()
  const otherTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      className="clarify-theme-toggle relative flex size-8 items-center justify-center rounded-(--clarify-theme-tokens-radius-md) transition hover:bg-[color-mix(in_srgb,var(--clarify-theme-tokens-colors-foreground)_5%,transparent)] dark:hover:bg-white/5"
      aria-label={otherTheme === 'dark' ? t('theme.switchToDark') : t('theme.switchToLight')}
      onClick={() => setTheme(otherTheme)}
    >
      <span className="absolute size-12 pointer-fine:hidden" />
      <SunIcon className="h-5 w-5 stroke-(--clarify-theme-tokens-colors-foreground) dark:hidden" />
      <MoonIcon className="hidden h-5 w-5 stroke-white dark:block" />
    </button>
  )
}
