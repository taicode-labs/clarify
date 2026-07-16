import type { ReactNode } from 'react'

import { useBuiltInText } from '../../core/i18n'

import { authLabel, authPlaceholder } from './ExamplePanels'
import type { AuthOption } from './ExamplePanels'
import { InlineListbox } from './InlineListbox'

export type OpenApiAuthPanelProps = {
  authOptions: AuthOption[]
  selectedAuthName: string
  selectedAuth?: AuthOption
  authValues: Record<string, string>
  onSelectAuth: (name: string) => void
  onChangeAuthValue: (name: string, value: string) => void
  onClearAuthValue: (name: string) => void
}

export function OpenApiAuthPanel(arg0: OpenApiAuthPanelProps): ReactNode {
  const { authOptions, selectedAuthName, selectedAuth, authValues, onSelectAuth, onChangeAuthValue, onClearAuthValue } = arg0
  const t = useBuiltInText()

  if (authOptions.length === 0) return null

  return (
    <div className="grid divide-y divide-(--clarify-theme-tokens-colors-border)">
        <label className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <span className="flex min-h-8 items-center border-r border-(--clarify-theme-tokens-colors-border) px-2 font-mono text-xs text-(--clarify-ui-text-strong)">Auth</span>
          <InlineListbox label="Auth" value={selectedAuthName} options={authOptions.map((option) => ({ value: option.key, label: option.label || t('openapi.none') }))} onChange={onSelectAuth} />
        </label>
        {selectedAuth?.schemes.map((option) => (
          <label key={option.name} className="group grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <span className="flex min-h-8 items-center border-r border-(--clarify-theme-tokens-colors-border) px-2 font-mono text-xs text-(--clarify-ui-text-strong)">{authLabel(option.name, option.scheme)}</span>
            <div className="flex min-w-0 items-center focus-within:bg-(--clarify-ui-hover-background)">
              <input type="password" value={authValues[option.name] ?? ''} placeholder={authPlaceholder(option)} onChange={(event) => onChangeAuthValue(option.name, event.target.value)} autoComplete="off" className="h-8 min-w-0 flex-1 border-0 bg-transparent px-2 text-xs text-(--clarify-theme-tokens-colors-foreground) outline-hidden placeholder:text-(--clarify-ui-text-faint)" />
              <button type="button" onClick={() => onClearAuthValue(option.name)} className="mr-1 h-6 shrink-0 rounded-(--clarify-theme-tokens-radius-md) px-1 text-2xs font-medium text-(--clarify-ui-text-faint) opacity-0 transition-opacity hover:text-(--clarify-theme-tokens-colors-foreground) focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--clarify-theme-tokens-colors-primary) group-hover:opacity-100">{t('openapi.clear')}</button>
            </div>
          </label>
        ))}
    </div>
  )
}
