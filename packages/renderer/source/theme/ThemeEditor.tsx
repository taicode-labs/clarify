import clsx from 'clsx'
import { ChevronDown, Settings, WandSparkles, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'

import { useConfigOptional, useConfigUpdaterOptional } from '../core/context'
import type {
  ThemeColorTokensConfig,
  ThemeColorValue,
  ThemeConfig,
  ThemeLayoutConfig,
  ThemePreset,
  ThemeRadiusTokensConfig,
} from '../types'

import { createRandomTabsLayout, createRandomTheme } from './randomTheme'
import { useTheme } from './ThemeProvider'
import { applyThemeCssVariables, themePresets, cloneTheme, resolveThemeColorValue, resolveThemeVariableTargets, themeToCssVariables } from './variables'
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
] as const satisfies ReadonlyArray<{ key: keyof ThemeColorTokensConfig; label: string }>

const radiusTokenFields = [
  { key: 'sm', label: 'Small' },
  { key: 'md', label: 'Medium' },
  { key: 'lg', label: 'Large' },
  { key: 'xl', label: 'Extra large' },
] as const satisfies ReadonlyArray<{ key: keyof ThemeRadiusTokensConfig; label: string }>

const layoutFields = [
  { key: 'maxWidth', label: 'Max width' },
] as const satisfies ReadonlyArray<{ key: keyof ThemeLayoutConfig; label: string }>

export type ThemeEditorProps = {
  /** The resolved theme to use as the editor's initial value. */
  initialTheme?: ThemeConfig;
  /** Called every time a token changes. */
  onChange?: (theme: ThemeConfig) => void;
  /** CSS variable target. Defaults to documentElement and every .clarify-app root. */
  target?: ThemeVariableTarget;
  /** Whether the panel is open by default. */
  defaultOpen?: boolean;
  className?: string;
}

export const themeEditorPresets = themePresets

export function applyThemeVariables(theme: ThemeConfig, target?: ThemeVariableTarget): () => void {
  return applyThemeCssVariables(themeToCssVariables(theme), resolveThemeVariableTargets(target))
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value)
}

function updateThemeModeColorValue(value: ThemeColorTokensConfig[keyof ThemeColorTokensConfig], mode: 'light' | 'dark', nextValue: string): ThemeColorTokensConfig[keyof ThemeColorTokensConfig] {
  if (typeof value === 'string') {
    return mode === 'light' ? { light: nextValue, dark: value } : { light: value, dark: nextValue }
  }

  return {
    ...value,
    [mode]: nextValue,
  }
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

type ColorFieldProps = {
  id: string;
  label: string;
  value: ThemeColorValue;
  onChange: (mode: 'light' | 'dark', value: string) => void;
}

function ColorField(props: ColorFieldProps) {
  const { id, label, value, onChange } = props
  const lightValue = resolveThemeColorValue(value, 'light')
  const darkValue = resolveThemeColorValue(value, 'dark')

  return (
    <div className="grid min-w-0 gap-1.5">
      <span className="text-xs/5 font-medium text-(--clarify-ui-text)">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        <ColorModeInput id={`${id}-light`} mode="light" value={lightValue} onChange={(v) => onChange('light', v)} />
        <ColorModeInput id={`${id}-dark`} mode="dark" value={darkValue} onChange={(v) => onChange('dark', v)} />
      </div>
    </div>
  )
}

type ColorModeInputProps = {
  id: string;
  mode: 'light' | 'dark';
  value: string;
  onChange: (value: string) => void;
}

function ColorModeInput(props: ColorModeInputProps) {
  const { id, mode, value, onChange } = props
  const canUseColorInput = isHexColor(value)

  function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value)
  }

  return (
    <label htmlFor={id} className="grid min-w-0 gap-1 text-[11px]/4 font-medium text-(--clarify-ui-text-faint)">
      <span className="flex min-w-0 items-center justify-between gap-2">
        <span className="uppercase tracking-wide">{mode}</span>
        {canUseColorInput ? (
          <input
            type="color"
            value={value}
            aria-label={`${id} color`}
            className="h-4 w-6 shrink-0 cursor-pointer rounded border border-(--clarify-theme-tokens-colors-border) bg-transparent p-0"
            onChange={handleTextChange}
          />
        ) : null}
      </span>
      <input
        id={id}
        value={value}
        spellCheck={false}
        className="h-8 w-full min-w-0 rounded-(--clarify-theme-tokens-radius-sm) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-background) px-2 font-mono text-xs text-(--clarify-theme-tokens-colors-foreground) shadow-xs outline-none transition focus:border-(--clarify-theme-tokens-colors-primary) focus:ring-2 focus:ring-(--clarify-ui-accent-border)"
        onChange={handleTextChange}
      />
    </label>
  )
}

function configToSource(theme: ThemeConfig, tabs: 'subnav' | 'navbar' = 'subnav'): string {
  return JSON.stringify(
    {
      theme: {
        preset: theme.preset,
        tokens: theme.tokens,
        layout: theme.layout,
      },
      layout: { tabs },
    },
    null,
    2,
  )
}

type UseThemeEditorStateArgs = {
  initialTheme?: ThemeConfig
  onChange?: (theme: ThemeConfig) => void
  target?: ThemeVariableTarget
  resolvedTheme: 'light' | 'dark'
}

function useThemeEditorState(arg0: UseThemeEditorStateArgs) {
  const { initialTheme, onChange, target, resolvedTheme } = arg0
  const [theme, setTheme] = useState<ThemeConfig>(() => cloneTheme(initialTheme ?? themeEditorPresets.default))
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const config = useConfigOptional()
  const configSource = useMemo(() => configToSource(theme, config?.layout?.tabs), [config?.layout?.tabs, theme])

  useEffect(() => applyThemeCssVariables(themeToCssVariables(theme, resolvedTheme), resolveThemeVariableTargets(target)), [resolvedTheme, target, theme])

  function commit(nextTheme: ThemeConfig) {
    setTheme(nextTheme)
    onChange?.(nextTheme)
  }

  function updatePreset(nextPreset: ThemePreset) {
    commit(cloneTheme(themeEditorPresets[nextPreset]))
  }

  function updateColorToken(key: keyof ThemeColorTokensConfig, mode: 'light' | 'dark', value: string) {
    commit({
      ...theme,
      tokens: {
        ...theme.tokens,
        colors: {
          ...theme.tokens.colors,
          [key]: updateThemeModeColorValue(theme.tokens.colors[key], mode, value),
        },
      },
    })
  }

  function updateRadiusToken(key: keyof ThemeRadiusTokensConfig, value: string) {
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

  function updateLayoutToken(key: keyof ThemeLayoutConfig, value: string) {
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
      setTimeout(() => setCopyState('idle'), 1400)
    } catch {
      setCopyState('failed')
      setTimeout(() => setCopyState('idle'), 1400)
    }
  }

  return {
    theme,
    copyState,
    commit,
    updatePreset,
    updateColorToken,
    updateRadiusToken,
    updateLayoutToken,
    copyConfig,
  }
}

export function ThemeEditor(props: ThemeEditorProps) {
  const { initialTheme, onChange, target, defaultOpen = false, className } = props
  const config = useConfigOptional()
  const updateConfig = useConfigUpdaterOptional()
  const { resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const {
    theme,
    copyState,
    commit,
    updatePreset,
    updateColorToken,
    updateRadiusToken,
    updateLayoutToken,
    copyConfig,
  } = useThemeEditorState({ initialTheme, onChange, target, resolvedTheme })

  function randomize() {
    commit(createRandomTheme())
    updateConfig?.(currentConfig => ({
      ...currentConfig,
      layout: { ...currentConfig.layout, tabs: createRandomTabsLayout() },
    }))
  }

  function renderPanelHeader() {
    return (
      <header className="shrink-0 flex items-start justify-between gap-4 border-b border-(--clarify-theme-tokens-colors-border) px-4 py-3">
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
    )
  }

  function renderPanelBody() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="grid gap-5">
          <label htmlFor="clarify-theme-editor-preset" className="grid gap-1.5 text-xs/5 font-medium text-(--clarify-ui-text)">
            Preset
            <span className="relative block">
              <select
                id="clarify-theme-editor-preset"
                value={theme.preset}
                className="h-9 w-full appearance-none rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-background) px-2.5 pr-9 text-sm text-(--clarify-theme-tokens-colors-foreground) shadow-xs outline-none transition focus:border-(--clarify-theme-tokens-colors-primary) focus:ring-2 focus:ring-(--clarify-ui-accent-border)"
                onChange={(event) => updatePreset(event.target.value as ThemePreset)}
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
                <ColorField
                  key={field.key}
                  id={`clarify-theme-editor-color-${field.key}`}
                  label={field.label}
                  value={theme.tokens.colors[field.key]}
                  onChange={(mode, value) => updateColorToken(field.key, mode, value)}
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
            {config && updateConfig ? (
              <label htmlFor="clarify-theme-editor-tabs-position" className="grid gap-1.5 text-xs/5 font-medium text-(--clarify-ui-text)">
                Tabs position
                <span className="relative block">
                  <select
                    id="clarify-theme-editor-tabs-position"
                    value={config.layout?.tabs ?? 'subnav'}
                    className="h-9 w-full appearance-none rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-background) px-2.5 pr-9 text-sm text-(--clarify-theme-tokens-colors-foreground) shadow-xs outline-none transition focus:border-(--clarify-theme-tokens-colors-primary) focus:ring-2 focus:ring-(--clarify-ui-accent-border)"
                    onChange={(event) => updateConfig(currentConfig => ({
                      ...currentConfig,
                      layout: { ...currentConfig.layout, tabs: event.target.value as 'subnav' | 'navbar' },
                    }))}
                  >
                    <option value="subnav">Below navbar</option>
                    <option value="navbar">Inside navbar</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 stroke-current stroke-2 text-(--clarify-ui-text-faint)" />
                </span>
              </label>
            ) : null}
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
    )
  }

  function renderPanelFooter() {
    return (
      <footer className="shrink-0 flex items-center justify-between gap-3 border-t border-(--clarify-theme-tokens-colors-border) bg-(--clarify-ui-subtle-background) px-4 py-3">
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
            onClick={randomize}
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
    )
  }

  function renderEditorPanel() {
    if (!isOpen) return null

    return (
      <section
        className="mb-3 flex max-h-(--clarify-theme-editor-panel-max-height) w-(--clarify-theme-editor-width) flex-col overflow-hidden rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface)/95 shadow-2xl shadow-zinc-900/15 backdrop-blur"
        aria-label="Clarify theme editor"
      >
        {renderPanelHeader()}
        {renderPanelBody()}
        {renderPanelFooter()}
      </section>
    )
  }

  return (
    <div className={clsx('clarify-theme-editor fixed right-4 bottom-4 z-50 text-(--clarify-theme-tokens-colors-foreground)', className)}>
      {renderEditorPanel()}

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
