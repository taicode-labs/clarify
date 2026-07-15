import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type SelectOption = {
  value: string
  label: string
}

type SelectControlProps = {
  label: string
  value: string
  options: Array<string | SelectOption>
  onChange: (value: string) => void
  icon?: ReactNode
  compact?: boolean
}

export function SelectControl(arg0: SelectControlProps): ReactNode {
  const {
    label,
    value,
    options,
    onChange,
    icon,
    compact = false,
  } = arg0

  const normalizedOptions = options.map((option) => (typeof option === 'string' ? { value: option, label: option } : option))
  const selectedOption = normalizedOptions.find((option) => option.value === value) ?? normalizedOptions[0]
  const wrapperClassName = compact ? 'clarify-openai-select relative min-w-0 text-xs' : 'clarify-openai-select relative shrink-0 text-xs'
  const buttonSizeClassName = compact ? 'w-full min-w-0 max-w-32' : 'min-w-28 max-w-48'

  if (normalizedOptions.length <= 1) return null

  return (
    <Listbox value={value} onChange={onChange}>
      <div className={wrapperClassName}>
        <ListboxButton
          aria-label={label}
          className={`clarify-openai-select-button flex min-h-8 ${buttonSizeClassName} items-center justify-between gap-2 rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-code-border) bg-(--clarify-code-control-background) px-2.5 py-1 text-xs font-medium whitespace-nowrap text-(--clarify-code-text) outline-hidden transition hover:border-(--clarify-code-border) hover:bg-(--clarify-code-control-background-hover) focus:ring-2 focus:ring-(--clarify-ui-accent-border) data-open:border-(--clarify-code-border) data-open:bg-(--clarify-code-control-background-active) data-open:ring-2 data-open:ring-(--clarify-ui-accent-border)`}
        >
          <span className="flex min-w-0 items-center gap-1.5 overflow-hidden">
            {icon ? <span className="shrink-0 text-(--clarify-code-faint)">{icon}</span> : null}
            <span className="truncate">{selectedOption?.label ?? value}</span>
          </span>
          <ChevronsUpDownIcon className="h-3.5 w-3.5 shrink-0 text-(--clarify-code-faint)" aria-hidden="true" />
        </ListboxButton>
        <ListboxOptions
          anchor="bottom end"
          className="clarify-openai-select-options z-30 mt-1 max-h-64 w-max min-w-(--button-width) max-w-(--clarify-popover-max-width) overflow-auto rounded-(--clarify-theme-tokens-radius-lg) bg-(--clarify-code-surface) p-1 text-xs shadow-lg shadow-black/20 ring-1 ring-(--clarify-code-border) [--anchor-gap:--spacing(1)] focus:outline-none"
        >
          {normalizedOptions.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              className="clarify-openai-select-option group flex min-h-9 cursor-default items-center justify-between gap-3 rounded-(--clarify-theme-tokens-radius-md) px-2.5 py-2 text-xs whitespace-nowrap text-(--clarify-code-control-text) select-none data-focus:bg-(--clarify-code-control-background-hover) data-focus:text-(--clarify-code-text) data-selected:bg-(--clarify-code-accent-background) data-selected:text-(--clarify-code-accent-text)"
            >
              <span>{option.label}</span>
              <CheckIcon className="h-3.5 w-3.5 shrink-0 opacity-0 group-data-selected:opacity-100" aria-hidden="true" />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  )
}
