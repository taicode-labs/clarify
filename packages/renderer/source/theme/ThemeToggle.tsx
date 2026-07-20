import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import clsx from 'clsx'
import { Monitor, Moon, Sun } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

import { useBuiltInText } from '../core/i18n'

import { useTheme, type Theme } from './ThemeProvider'

type ThemeOption = {
  value: Theme
  label: 'theme.light' | 'theme.dark' | 'theme.system'
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const themeOptions: ThemeOption[] = [
  { value: 'light', label: 'theme.light', icon: Sun },
  { value: 'dark', label: 'theme.dark', icon: Moon },
  { value: 'system', label: 'theme.system', icon: Monitor },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const t = useBuiltInText()
  const selectedOption = themeOptions.find(option => option.value === theme) ?? themeOptions[2]
  const SelectedIcon = selectedOption.icon

  return (
    <Menu as="div" className="clarify-theme-toggle relative">
      <MenuButton
        className="clarify-theme-toggle-button clarify-ui-control relative flex size-9 items-center justify-center rounded-(--clarify-theme-tokens-radius-md) transition"
        aria-label={t('theme.switch')}
      >
        <span className="absolute size-11 pointer-fine:hidden" />
        <SelectedIcon className="h-5 w-5 stroke-current" />
      </MenuButton>
      <MenuItems
        transition
        modal={false}
        className="clarify-theme-toggle-menu clarify-ui-menu absolute right-0 z-50 mt-2 w-(--clarify-ui-menu-width) rounded-(--clarify-theme-tokens-radius-xl) bg-(--clarify-theme-tokens-colors-surface) p-1 shadow-lg ring-1 shadow-zinc-900/5 ring-(--clarify-theme-tokens-colors-border) transition data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in dark:bg-zinc-900 dark:ring-white/10"
      >
        {themeOptions.map((option) => {
          const Icon = option.icon
          const selected = option.value === theme

          return (
            <MenuItem key={option.value}>
              {({ focus }) => (
                <button
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={clsx(
                    'clarify-theme-toggle-item clarify-ui-menu-item flex w-full items-center gap-2 rounded-(--clarify-theme-tokens-radius-lg) px-3 py-2 text-left transition',
                    focus && 'clarify-ui-menu-item-focus',
                    selected && 'clarify-ui-menu-item-active',
                  )}
                  aria-pressed={selected}
                >
                  <Icon className="h-4 w-4 stroke-current" />
                  <span>{t(option.label)}</span>
                </button>
              )}
            </MenuItem>
          )
        })}
      </MenuItems>
    </Menu>
  )
}
