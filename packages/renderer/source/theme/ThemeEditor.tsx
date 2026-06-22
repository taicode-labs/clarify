import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, ComponentPropsWithoutRef } from 'react'

import type {
  ClarifyThemeColorTokensConfig,
  ClarifyThemeConfig,
  ClarifyThemeLayoutConfig,
  ClarifyThemePreset,
  ClarifyThemeRadiusTokensConfig,
} from '../types'

const colorTokenFields = [
  { key: 'primary', label: 'Primary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'foreground', label: 'Foreground' },
  { key: 'surface', label: 'Surface' },
  { key: 'muted', label: 'Muted' },
  { key: 'border', label: 'Border' },
  { key: 'codeBackground', label: 'Code background' },
] as const satisfies ReadonlyArray<{ key: keyof ClarifyThemeColorTokensConfig; label: string }>

const radiusTokenFields = [
  { key: 'sm', label: 'Small' },
  { key: 'md', label: 'Medium' },
  { key: 'lg', label: 'Large' },
  { key: 'xl', label: 'Extra large' },
] as const satisfies ReadonlyArray<{ key: keyof ClarifyThemeRadiusTokensConfig; label: string }>

const layoutFields = [
  { key: 'maxWidth', label: 'Max width' },
] as const satisfies ReadonlyArray<{ key: keyof ClarifyThemeLayoutConfig; label: string }>

type ThemeCssVariables = Record<`--clarify-theme-${string}`, string>

type ThemeEditorTarget = HTMLElement | string

export type ThemeEditorProps = {
  /** The resolved theme to use as the editor's initial value. */
  initialTheme?: ClarifyThemeConfig;
  /** Called every time a token changes. */
  onChange?: (theme: ClarifyThemeConfig) => void;
  /** CSS variable target. Defaults to documentElement and every .clarify-app root. */
  target?: ThemeEditorTarget;
  /** Whether the panel is open by default. */
  defaultOpen?: boolean;
  className?: string;
}

export const clarifyThemeEditorPresets = {
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
  },
} satisfies Record<ClarifyThemePreset, ClarifyThemeConfig>

function cloneTheme(theme: ClarifyThemeConfig): ClarifyThemeConfig {
  return {
    preset: theme.preset,
    tokens: {
      colors: { ...theme.tokens.colors },
      radius: { ...theme.tokens.radius },
    },
    layout: { ...theme.layout },
  }
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

function uniqueElements(elements: HTMLElement[]): HTMLElement[] {
  return Array.from(new Set(elements))
}

function resolveTargets(target?: ThemeEditorTarget): HTMLElement[] {
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

export function applyClarifyThemeVariables(theme: ClarifyThemeConfig, target?: ThemeEditorTarget): () => void {
  const variables = themeToCssVariables(theme)
  const targets = resolveTargets(target)
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

function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value)
}

function SettingsIcon(props: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 3.75v1.1M10 15.15v1.1M15.15 10h1.1M3.75 10h1.1M13.64 6.36l.78-.78M5.58 14.42l.78-.78M13.64 13.64l.78.78M5.58 5.58l.78.78" />
      <path d="M12.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
    </svg>
  )
}

function CloseIcon(props: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 8 8M14 6l-8 8" />
    </svg>
  )
}

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  withColorInput?: boolean;
}

function TextField(props: TextFieldProps) {
  const { id, label, value, onChange, withColorInput = false } = props
  const canUseColorInput = withColorInput && isHexColor(value)

  function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value)
  }

  return (
    <label htmlFor={id} className="grid min-w-0 gap-1.5 text-xs/5 font-medium text-(--clarify-ui-text)">
      <span className="flex min-w-0 items-center justify-between gap-3">
        <span className="truncate">{label}</span>
        {canUseColorInput ? (
          <input
            type="color"
            value={value}
            aria-label={`${label} color`}
            className="h-5 w-8 shrink-0 cursor-pointer rounded border border-(--clarify-theme-tokens-colors-border) bg-transparent p-0"
            onChange={handleTextChange}
          />
        ) : null}
      </span>
      <input
        id={id}
        value={value}
        spellCheck={false}
        className="h-9 w-full min-w-0 rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-background) px-2.5 font-mono text-xs text-(--clarify-theme-tokens-colors-foreground) shadow-xs outline-none transition focus:border-(--clarify-theme-tokens-colors-primary) focus:ring-2 focus:ring-(--clarify-ui-accent-border) dark:border-white/10 dark:bg-zinc-950 dark:text-white"
        onChange={handleTextChange}
      />
    </label>
  )
}

function themeToConfigSource(theme: ClarifyThemeConfig): string {
  return JSON.stringify(
    {
      theme: {
        preset: theme.preset,
        tokens: theme.tokens,
        layout: theme.layout,
      },
    },
    null,
    2,
  )
}

export function ThemeEditor(props: ThemeEditorProps) {
  const { initialTheme, onChange, target, defaultOpen = false, className } = props
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [theme, setTheme] = useState<ClarifyThemeConfig>(() => cloneTheme(initialTheme ?? clarifyThemeEditorPresets.default))
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const configSource = useMemo(() => themeToConfigSource(theme), [theme])

  useEffect(() => applyClarifyThemeVariables(theme, target), [target, theme])

  function commit(nextTheme: ClarifyThemeConfig) {
    setTheme(nextTheme)
    onChange?.(nextTheme)
  }

  function updatePreset(nextPreset: ClarifyThemePreset) {
    commit(cloneTheme(clarifyThemeEditorPresets[nextPreset]))
  }

  function updateColorToken(key: keyof ClarifyThemeColorTokensConfig, value: string) {
    commit({
      ...theme,
      tokens: {
        ...theme.tokens,
        colors: {
          ...theme.tokens.colors,
          [key]: value,
        },
      },
    })
  }

  function updateRadiusToken(key: keyof ClarifyThemeRadiusTokensConfig, value: string) {
    commit({
      ...theme,
      tokens: {
        ...theme.tokens,
        radius: {
          ...theme.tokens.radius,
          [key]: value,
        },
      },
    })
  }

  function updateLayoutToken(key: keyof ClarifyThemeLayoutConfig, value: string) {
    commit({
      ...theme,
      layout: {
        ...theme.layout,
        [key]: value,
      },
    })
  }

  async function copyConfig() {
    try {
      await navigator.clipboard.writeText(configSource)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1400)
    } catch {
      setCopyState('failed')
      window.setTimeout(() => setCopyState('idle'), 1400)
    }
  }

  return (
    <div className={clsx('clarify-theme-editor fixed right-4 bottom-4 z-50 text-(--clarify-theme-tokens-colors-foreground)', className)}>
      {isOpen ? (
        <section
          className="mb-3 w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-(--clarify-theme-tokens-radius-xl) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface)/95 shadow-2xl shadow-zinc-900/15 backdrop-blur dark:border-white/10 dark:bg-zinc-900/95 dark:shadow-black/30"
          aria-label="Clarify theme editor"
        >
          <header className="flex items-start justify-between gap-4 border-b border-(--clarify-theme-tokens-colors-border) px-4 py-3 dark:border-white/10">
            <div>
              <h2 className="text-sm/6 font-semibold text-(--clarify-theme-tokens-colors-foreground) dark:text-white">Theme editor</h2>
              <p className="mt-0.5 text-xs/5 text-(--clarify-ui-text-soft)">Live CSS variable preview for Clarify theme tokens.</p>
            </div>
            <button
              type="button"
              className="-mr-1 flex size-8 items-center justify-center rounded-(--clarify-theme-tokens-radius-md) text-(--clarify-ui-text-soft) transition hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-ui-text-strong)"
              aria-label="Close theme editor"
              onClick={() => setIsOpen(false)}
            >
              <CloseIcon className="size-4 stroke-current stroke-2" />
            </button>
          </header>

          <div className="max-h-[min(42rem,calc(100vh-7rem))] overflow-y-auto px-4 py-4">
            <div className="grid gap-5">
              <label htmlFor="clarify-theme-editor-preset" className="grid gap-1.5 text-xs/5 font-medium text-(--clarify-ui-text)">
                Preset
                <select
                  id="clarify-theme-editor-preset"
                  value={theme.preset}
                  className="h-9 rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-background) px-2.5 text-sm text-(--clarify-theme-tokens-colors-foreground) shadow-xs outline-none transition focus:border-(--clarify-theme-tokens-colors-primary) focus:ring-2 focus:ring-(--clarify-ui-accent-border) dark:border-white/10 dark:bg-zinc-950 dark:text-white"
                  onChange={(event) => updatePreset(event.target.value as ClarifyThemePreset)}
                >
                  <option value="default">default</option>
                  <option value="base">base</option>
                </select>
              </label>

              <fieldset className="grid gap-3">
                <legend className="mb-2 text-xs/5 font-semibold uppercase tracking-wide text-(--clarify-ui-text-faint)">Colors</legend>
                <div className="grid grid-cols-1 gap-3">
                  {colorTokenFields.map((field) => (
                    <TextField
                      key={field.key}
                      id={`clarify-theme-editor-color-${field.key}`}
                      label={field.label}
                      value={theme.tokens.colors[field.key]}
                      withColorInput
                      onChange={(value) => updateColorToken(field.key, value)}
                    />
                  ))}
                </div>
              </fieldset>

              <fieldset className="grid gap-3">
                <legend className="mb-2 text-xs/5 font-semibold uppercase tracking-wide text-(--clarify-ui-text-faint)">Radius</legend>
                <div className="grid grid-cols-2 gap-3">
                  {radiusTokenFields.map((field) => (
                    <TextField
                      key={field.key}
                      id={`clarify-theme-editor-radius-${field.key}`}
                      label={field.label}
                      value={theme.tokens.radius[field.key]}
                      onChange={(value) => updateRadiusToken(field.key, value)}
                    />
                  ))}
                </div>
              </fieldset>

              <fieldset className="grid gap-3">
                <legend className="mb-2 text-xs/5 font-semibold uppercase tracking-wide text-(--clarify-ui-text-faint)">Layout</legend>
                {layoutFields.map((field) => (
                  <TextField
                    key={field.key}
                    id={`clarify-theme-editor-layout-${field.key}`}
                    label={field.label}
                    value={theme.layout[field.key]}
                    onChange={(value) => updateLayoutToken(field.key, value)}
                  />
                ))}
              </fieldset>
            </div>
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-(--clarify-theme-tokens-colors-border) bg-(--clarify-ui-subtle-background) px-4 py-3 dark:border-white/10">
            <button
              type="button"
              className="rounded-(--clarify-theme-tokens-radius-md) px-2.5 py-1.5 text-xs/5 font-semibold text-(--clarify-ui-text) transition hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-ui-text-strong)"
              onClick={() => updatePreset(theme.preset)}
            >
              Reset preset
            </button>
            <button
              type="button"
              className="rounded-(--clarify-theme-tokens-radius-md) bg-(--clarify-theme-tokens-colors-primary) px-3 py-1.5 text-xs/5 font-semibold text-white shadow-xs transition hover:opacity-90"
              onClick={copyConfig}
            >
              {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy config'}
            </button>
          </footer>
        </section>
      ) : null}

      <button
        type="button"
        className="ml-auto flex size-12 items-center justify-center rounded-full border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface)/95 text-(--clarify-theme-tokens-colors-primary) shadow-xl shadow-zinc-900/15 backdrop-blur transition hover:scale-105 hover:bg-(--clarify-ui-accent-background) focus:outline-none focus:ring-2 focus:ring-(--clarify-ui-accent-border) dark:border-white/10 dark:bg-zinc-900/95"
        aria-label={isOpen ? 'Close Clarify theme editor' : 'Open Clarify theme editor'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        <SettingsIcon className="size-5 stroke-current stroke-2" />
      </button>
    </div>
  )
}
