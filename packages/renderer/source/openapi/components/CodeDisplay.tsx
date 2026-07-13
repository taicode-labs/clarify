import { CheckIcon, ClipboardIcon, CodeIcon, PackageIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { useBuiltInText } from '../../core/i18n'
import { copyTextToClipboard } from '../../utils/clipboard'

import { SelectControl, type SelectOption } from './SelectControl'

type CopyCodeButtonProps = { code: string }

export function CopyCodeButton(arg0: CopyCodeButtonProps): ReactNode {
  const { code } = arg0

  const t = useBuiltInText()
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      onClick={() => {
        void copyTextToClipboard(code).then((ok) => {
          if (!ok) return
          setCopied(true)
          setTimeout(() => setCopied(false), 1000)
        })
      }}
      className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-(--clarify-code-control-background) px-2.5 py-1.5 text-2xs font-medium whitespace-nowrap text-(--clarify-code-muted) transition hover:bg-(--clarify-code-control-background-hover) hover:text-(--clarify-code-text) focus:bg-(--clarify-code-control-background-hover) focus:text-(--clarify-code-text)"
    >
      {copied ? (
        <CheckIcon className="h-3.5 w-3.5 text-(--clarify-theme-tokens-colors-primary)" aria-hidden="true" />
      ) : (
        <ClipboardIcon className="h-3.5 w-3.5 text-(--clarify-code-faint)" aria-hidden="true" />
      )}
      <span>{copied ? t('actions.copied') : t('actions.copy')}</span>
    </button>
  )
}

type ExampleMetaValueProps = {
  label: string
  value: string
  options?: string[]
  onChange?: (value: string) => void
  className: string
}

export function ExampleMetaValue(arg0: ExampleMetaValueProps): ReactNode {
  const { label, value, options, onChange, className } = arg0

  if (options && options.length > 1 && onChange) {
    return <SelectControl label={label} value={value} options={options} onChange={onChange} />
  }

  return <span className={className}>{value}</span>
}

type CodeToolbarProps = {
  code: string
  leadingControls?: ReactNode
  languageOptions?: SelectOption[]
  selectedLanguageKey?: string
  onSelectLanguage?: (key: string) => void
  clientOptions?: SelectOption[]
  selectedClientKey?: string
  onSelectClient?: (key: string) => void
}

export function CodeToolbar(arg0: CodeToolbarProps): ReactNode {
  const {
    code,
    leadingControls,
    languageOptions,
    selectedLanguageKey,
    onSelectLanguage,
    clientOptions,
    selectedClientKey,
    onSelectClient,
  } = arg0

  const t = useBuiltInText()
  const inlineControls = Boolean(leadingControls)

  return (
    <div className={`clarify-openai-code-toolbar flex items-center gap-2 px-4 pt-3${inlineControls ? ' clarify-openai-code-toolbar-inline' : ''}`}>
      <div className={`clarify-openai-code-toolbar-controls flex min-w-0 flex-1 items-center gap-2${inlineControls ? ' flex-nowrap overflow-x-auto' : ' flex-wrap'}`}>
        {leadingControls}
        {languageOptions && languageOptions.length > 1 && selectedLanguageKey && onSelectLanguage ? (
          <SelectControl
            label={t('openapi.language')}
            value={selectedLanguageKey}
            options={languageOptions}
            onChange={onSelectLanguage}
            icon={<CodeIcon className="h-3.5 w-3.5" aria-hidden="true" />}
          />
        ) : null}
        {clientOptions && clientOptions.length > 1 && selectedClientKey && onSelectClient ? (
          <SelectControl
            label={t('openapi.client')}
            value={selectedClientKey}
            options={clientOptions}
            onChange={onSelectClient}
            icon={<PackageIcon className="h-3.5 w-3.5" aria-hidden="true" />}
          />
        ) : null}
      </div>
      <CopyCodeButton code={code} />
    </div>
  )
}
