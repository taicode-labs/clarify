import clsx from 'clsx'
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
  onClearAuthValues: () => void
  embedded?: boolean
}

export function OpenApiAuthPanel(arg0: OpenApiAuthPanelProps): ReactNode {
  const { authOptions, selectedAuthName, selectedAuth, authValues, onSelectAuth, onChangeAuthValue, onClearAuthValue, onClearAuthValues, embedded = false } = arg0
  const t = useBuiltInText()

  if (authOptions.length === 0) return null

  return (
    <div className={clsx(embedded ? 'sm:col-span-2' : 'border-t border-(--clarify-theme-tokens-colors-border) bg-(--clarify-ui-subtle-background) p-3')}>
      <div className="grid gap-3 sm:grid-cols-(--clarify-openapi-control-grid)">
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-2xs font-semibold text-(--clarify-ui-text-soft)">Auth</span>
          <InlineListbox label="Auth" value={selectedAuthName} options={authOptions.map((option) => ({ value: option.key, label: option.label || t('openapi.none') }))} onChange={onSelectAuth} />
        </label>
        {selectedAuth?.schemes.map((option) => (
          <label key={option.name} className="flex min-w-0 flex-col gap-1.5">
            <span className="text-2xs font-semibold text-(--clarify-ui-text-soft)">{authLabel(option.name, option.scheme)}</span>
            <div className="flex min-w-0 items-center rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) px-2.5 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-(--clarify-theme-tokens-colors-primary)">
              <input type="password" value={authValues[option.name] ?? ''} placeholder={authPlaceholder(option)} onChange={(event) => onChangeAuthValue(option.name, event.target.value)} autoComplete="off" className="min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-xs font-semibold text-(--clarify-theme-tokens-colors-foreground) outline-hidden placeholder:text-(--clarify-ui-text-faint)" />
              <button type="button" onClick={() => onClearAuthValue(option.name)} className="ml-2 min-h-6 shrink-0 rounded-sm text-2xs font-semibold text-(--clarify-ui-text-soft) hover:text-(--clarify-theme-tokens-colors-foreground) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)">{t('openapi.clear')}</button>
            </div>
          </label>
        ))}
        {selectedAuth && selectedAuth.schemes.length > 0 ? (
          <button type="button" onClick={onClearAuthValues} className="min-h-7 justify-self-start rounded-sm text-2xs font-semibold text-(--clarify-ui-text-soft) hover:text-(--clarify-theme-tokens-colors-foreground) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)">{t('openapi.clearAllCredentials')}</button>
        ) : null}
      </div>
    </div>
  )
}
