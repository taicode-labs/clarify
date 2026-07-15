import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import clsx from 'clsx'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type UiOption = {
  value: string
  label: string
  description?: string
}

type InlineListboxProps = {
  label: string
  value: string
  options: UiOption[]
  onChange: (value: string) => void
  compact?: boolean
  buttonContent?: ReactNode
  buttonClassName?: string
  className?: string
  invalid?: boolean
  describedBy?: string
  disabled?: boolean
}

export function InlineListbox(arg0: InlineListboxProps): ReactNode {
  const { label, value, options, onChange, compact = false, buttonContent, buttonClassName, className, invalid, describedBy, disabled = false } = arg0
  const selected = options.find((option) => option.value === value)

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className={clsx('pointer-events-auto relative inline-flex min-w-0', className)}>
        <ListboxButton
          aria-label={label}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={clsx(
            buttonClassName ?? 'inline-flex min-w-0 items-center gap-1 rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) font-semibold text-(--clarify-ui-text-strong) shadow-xs outline-hidden transition hover:border-(--clarify-ui-text-faint) hover:bg-(--clarify-ui-hover-background) focus:ring-2 focus:ring-(--clarify-theme-tokens-colors-primary) data-disabled:cursor-not-allowed data-open:border-(--clarify-ui-accent-border) data-open:bg-(--clarify-ui-active-background) data-open:ring-2 data-open:ring-(--clarify-ui-accent-border)',
            buttonClassName ? null : compact ? 'min-h-7 max-w-32 px-2 py-0.5 text-xs' : 'min-h-8 w-full px-2.5 py-1.5 text-xs',
          )}
        >
          {buttonContent ?? (
            <>
              <span className="truncate">{selected?.label ?? (value || label)}</span>
              <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-(--clarify-ui-text-faint)" aria-hidden="true" />
            </>
          )}
        </ListboxButton>
        <ListboxOptions anchor="bottom start" className="z-30 mt-1 max-h-64 w-max min-w-(--button-width) max-w-(--clarify-popover-max-width) overflow-auto rounded-xl bg-(--clarify-theme-tokens-colors-surface) p-1 text-xs shadow-lg shadow-black/10 ring-1 ring-(--clarify-theme-tokens-colors-border) [--anchor-gap:--spacing(1)] focus:outline-none">
          {options.map((option) => (
            <ListboxOption key={option.value} value={option.value} className="group flex min-h-9 cursor-default items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-xs text-(--clarify-ui-text) select-none data-focus:bg-(--clarify-ui-hover-background) data-focus:text-(--clarify-ui-text-strong) data-selected:bg-(--clarify-ui-active-background) data-selected:text-(--clarify-ui-accent-text)">
              <span className="min-w-0">
                <span className="block truncate">{option.label}</span>
                {option.description ? <span className="mt-0.5 block truncate text-2xs text-(--clarify-ui-text-faint)">{option.description}</span> : null}
              </span>
              <CheckIcon className="h-3.5 w-3.5 shrink-0 opacity-0 group-data-selected:opacity-100" aria-hidden="true" />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  )
}
