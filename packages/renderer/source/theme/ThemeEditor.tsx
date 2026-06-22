import clsx from 'clsx'
import { ChevronDown, Settings, WandSparkles, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'

import type {
  ClarifyThemeColorTokensConfig,
  ClarifyThemeConfig,
  ClarifyThemeLayoutConfig,
  ClarifyThemePreset,
  ClarifyThemeRadiusTokensConfig,
} from '../types'

import { createRandomTheme } from './randomTheme'
import { useTheme } from './ThemeProvider'
import { applyThemeCssVariables, clarifyThemePresets, cloneTheme, resolveThemeVariableTargets, themeToCssVariables } from './variables'
import type { ThemeVariableTarget } from './variables'

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

export type ThemeEditorProps = {
  /** The resolved theme to use as the editor's initial value. */
  initialTheme?: ClarifyThemeConfig;
  /** Called every time a token changes. */
  onChange?: (theme: ClarifyThemeConfig) => void;
  /** CSS variable target. Defaults to documentElement and every .clarify-app root. */
  target?: ThemeVariableTarget;
  /** Whether the panel is open by default. */
  defaultOpen?: boolean;
  className?: string;
}

export const clarifyThemeEditorPresets = clarifyThemePresets

export function applyClarifyThemeVariables(theme: ClarifyThemeConfig, target?: ThemeVariableTarget): () => void {
  return applyThemeCssVariables(themeToCssVariables(theme), resolveThemeVariableTargets(target))
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value)
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
        className="h-9 w-full min-w-0 rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-background) px-2.5 font-mono text-xs text-(--clarify-theme-tokens-colors-foreground) shadow-xs outline-none transition focus:border-(--clarify-theme-tokens-colors-primary) focus:ring-2 focus:ring-(--clarify-ui-accent-border)"
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
  const { resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [theme, setTheme] = useState<ClarifyThemeConfig>(() => cloneTheme(initialTheme ?? clarifyThemeEditorPresets.default))
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const configSource = useMemo(() => themeToConfigSource(theme), [theme])

  useEffect(() => applyThemeCssVariables(themeToCssVariables(theme, resolvedTheme), resolveThemeVariableTargets(target)), [resolvedTheme, target, theme])

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
          className="mb-3 w-(--clarify-theme-editor-width) overflow-hidden rounded-(--clarify-theme-tokens-radius-xl) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface)/95 shadow-2xl shadow-zinc-900/15 backdrop-blur"
          aria-label="Clarify theme editor"
        >
          <header className="flex items-start justify-between gap-4 border-b border-(--clarify-theme-tokens-colors-border) px-4 py-3">
            <div>
              <h2 className="text-sm/6 font-semibold text-(--clarify-theme-tokens-colors-foreground)">Theme editor</h2>
              <p className="mt-0.5 text-xs/5 text-(--clarify-ui-text-soft)">Live CSS variable preview for Clarify theme tokens.</p>
            </div>
            <button
              type="button"
              className="-mr-1 flex size-8 items-center justify-center rounded-(--clarify-theme-tokens-radius-md) text-(--clarify-ui-text-soft) transition hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-ui-text-strong)"
              aria-label="Close theme editor"
              onClick={() => setIsOpen(false)}
            >
              <X className="size-4 stroke-current stroke-2" />
            </button>
          </header>

          <div className="max-h-(--clarify-theme-editor-body-max-height) overflow-y-auto px-4 py-4">
            <div className="grid gap-5">
              <label htmlFor="clarify-theme-editor-preset" className="grid gap-1.5 text-xs/5 font-medium text-(--clarify-ui-text)">
                Preset
                <span className="relative block">
                  <select
                    id="clarify-theme-editor-preset"
                    value={theme.preset}
                    className="h-9 w-full appearance-none rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-background) px-2.5 pr-9 text-sm text-(--clarify-theme-tokens-colors-foreground) shadow-xs outline-none transition focus:border-(--clarify-theme-tokens-colors-primary) focus:ring-2 focus:ring-(--clarify-ui-accent-border)"
                    onChange={(event) => updatePreset(event.target.value as ClarifyThemePreset)}
                  >
                    <option value="default">default</option>
                    <option value="base">base</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 stroke-current stroke-2 text-(--clarify-ui-text-faint)" />
                </span>
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

          <footer className="flex items-center justify-between gap-3 border-t border-(--clarify-theme-tokens-colors-border) bg-(--clarify-ui-subtle-background) px-4 py-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="rounded-(--clarify-theme-tokens-radius-md) px-2.5 py-1.5 text-xs/5 font-semibold text-(--clarify-ui-text) transition hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-ui-text-strong)"
                onClick={() => updatePreset(theme.preset)}
              >
                Reset preset
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-(--clarify-theme-tokens-radius-md) px-2.5 py-1.5 text-xs/5 font-semibold text-(--clarify-ui-text) transition hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-ui-text-strong)"
                onClick={() => commit(createRandomTheme())}
              >
                <WandSparkles className="size-3.5 stroke-current stroke-2" />
                Random
              </button>
            </div>
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
        className="ml-auto flex size-12 items-center justify-center rounded-full border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface)/95 text-(--clarify-theme-tokens-colors-primary) shadow-xl shadow-zinc-900/15 backdrop-blur transition hover:scale-105 hover:bg-(--clarify-ui-accent-background) focus:outline-none focus:ring-2 focus:ring-(--clarify-ui-accent-border)"
        aria-label={isOpen ? 'Close Clarify theme editor' : 'Open Clarify theme editor'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        <Settings className="size-5 stroke-current stroke-2" />
      </button>
    </div>
  )
}
