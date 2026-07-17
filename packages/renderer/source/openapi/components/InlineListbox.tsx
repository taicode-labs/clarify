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
  title?: string
}

type MultiInlineListboxProps = {
  label: string
  value: string[]
  options: UiOption[]
  onChange: (value: string[]) => void
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
}

type OptionContentProps = {
  option: UiOption
}

const defaultButtonClassName = 'inline-flex min-w-0 items-center justify-between gap-1 border-0 bg-transparent font-medium text-(--clarify-ui-text-strong) outline-hidden transition hover:bg-(--clarify-ui-hover-background) focus:ring-2 focus:ring-inset focus:ring-(--clarify-theme-tokens-colors-primary) data-disabled:cursor-not-allowed data-open:bg-(--clarify-ui-active-background)'
const optionsClassName = 'z-30 mt-1 max-h-64 w-max min-w-(--button-width) max-w-(--clarify-popover-max-width) overflow-auto rounded-(--clarify-theme-tokens-radius-lg) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-1 text-xs shadow-lg shadow-black/10 [--anchor-gap:--spacing(1)] focus:outline-none'
const optionClassName = 'group flex min-h-9 cursor-default items-center justify-between gap-3 rounded-(--clarify-theme-tokens-radius-md) px-2.5 py-2 text-xs text-(--clarify-ui-text) select-none data-focus:bg-(--clarify-ui-hover-background) data-focus:text-(--clarify-ui-text-strong) data-selected:bg-(--clarify-ui-active-background) data-selected:text-(--clarify-ui-accent-text)'

function OptionContent(arg0: OptionContentProps): ReactNode {
  const { option } = arg0
  return (
    <>
      <span className="min-w-0">
        <span className="block truncate">{option.label}</span>
        {option.description ? <span className="mt-0.5 block truncate text-2xs text-(--clarify-ui-text-faint)">{option.description}</span> : null}
      </span>
      <CheckIcon className="h-3.5 w-3.5 shrink-0 opacity-0 group-data-selected:opacity-100" aria-hidden="true" />
    </>
  )
}

export function InlineListbox(arg0: InlineListboxProps): ReactNode {
  const { label, value, options, onChange, compact = false, buttonContent, buttonClassName, className, invalid, describedBy, disabled = false, title } = arg0
  const selected = options.find((option) => option.value === value)

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className={clsx('pointer-events-auto relative inline-flex min-w-0 w-full', className)}>
        <ListboxButton
          aria-label={label}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          title={title}
          className={clsx(
            buttonClassName ?? defaultButtonClassName,
            buttonClassName ? null : compact ? 'min-h-7 max-w-32 px-2 py-0.5 text-xs' : 'min-h-8 w-full px-2 text-xs',
          )}
        >
          {buttonContent ?? (
            <>
              <span className="truncate">{selected?.label ?? (value || label)}</span>
              <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-(--clarify-ui-text-faint)" aria-hidden="true" />
            </>
          )}
        </ListboxButton>
        <ListboxOptions anchor="bottom start" className={optionsClassName}>
          {options.map((option) => (
            <ListboxOption key={option.value} value={option.value} className={optionClassName}>
              <OptionContent option={option} />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  )
}

export function MultiInlineListbox(arg0: MultiInlineListboxProps): ReactNode {
  const { label, value, options, onChange, disabled = false, invalid, describedBy } = arg0
  const selected = options.filter((option) => value.includes(option.value))
  const selectedLabel = selected.map((option) => option.label).join(', ')

  return (
    <Listbox value={value} onChange={onChange} multiple disabled={disabled}>
      <div className="pointer-events-auto relative inline-flex min-w-0 w-full">
        <ListboxButton aria-label={label} aria-invalid={invalid || undefined} aria-describedby={describedBy} className={clsx(defaultButtonClassName, 'min-h-8 w-full px-2 text-xs')}>
          <span className="truncate">{selectedLabel || label}</span>
          <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-(--clarify-ui-text-faint)" aria-hidden="true" />
        </ListboxButton>
        <ListboxOptions anchor="bottom start" className={optionsClassName}>
          {options.map((option) => (
            <ListboxOption key={option.value} value={option.value} className={optionClassName}>
              <OptionContent option={option} />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  )
}
