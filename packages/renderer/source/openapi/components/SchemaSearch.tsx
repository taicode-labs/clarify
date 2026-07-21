import clsx from 'clsx'
import { SearchIcon } from 'lucide-react'
import { useState, type ChangeEvent, type ReactNode } from 'react'

export function useSchemaSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  return {
    open,
    query,
    onChange: (event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value),
    toggle: () => {
      setOpen((current) => {
        if (current) setQuery('')
        return !current
      })
    },
  }
}

type SchemaSearchButtonProps = {
  label: string
  open: boolean
  onClick: () => void
}

export function SchemaSearchButton(arg0: SchemaSearchButtonProps): ReactNode {
  const { label, open, onClick } = arg0

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={open}
      onClick={onClick}
      className={clsx(
        'flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-(--clarify-theme-tokens-radius-md) transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)',
        open
          ? 'bg-(--clarify-ui-hover-background) text-(--clarify-theme-tokens-colors-primary)'
          : 'text-(--clarify-ui-text-faint) hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-theme-tokens-colors-foreground)',
      )}
    >
      <SearchIcon className="size-4" aria-hidden="true" />
    </button>
  )
}

type SchemaSearchInputProps = {
  label: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export function SchemaSearchInput(arg0: SchemaSearchInputProps): ReactNode {
  const { label, value, onChange } = arg0

  return (
    <label className="not-prose mb-3 flex h-9 items-center gap-2 rounded-(--clarify-theme-tokens-radius-md) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) px-3 transition focus-within:border-(--clarify-theme-tokens-colors-primary) focus-within:ring-2 focus-within:ring-(--clarify-theme-tokens-colors-primary)/15">
      <SearchIcon className="size-4 shrink-0 text-(--clarify-ui-text-faint)" aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={label}
        autoFocus
        className="min-w-0 flex-1 bg-transparent text-sm text-(--clarify-theme-tokens-colors-foreground) outline-none placeholder:text-(--clarify-ui-text-faint)"
      />
    </label>
  )
}