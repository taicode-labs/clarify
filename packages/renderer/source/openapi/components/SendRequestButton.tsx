import { LoaderCircleIcon, SendIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type SendRequestButtonProps = {
  label: string
  busy?: boolean
  text?: string
  onClick: () => void
}

export function SendRequestButton(arg0: SendRequestButtonProps): ReactNode {
  const { label, busy = false, text, onClick } = arg0
  const showText = Boolean(text)

  return (
    <button
      type="button"
      disabled={busy}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={showText
        ? 'flex h-8 shrink-0 items-center gap-1.5 rounded bg-(--clarify-theme-tokens-colors-foreground) px-3 text-xs font-semibold text-(--clarify-theme-tokens-colors-background) transition hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-foreground) focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60'
        : 'grid size-7 shrink-0 place-items-center rounded bg-(--clarify-ui-accent-background) text-(--clarify-ui-accent-text) ring-1 ring-inset ring-(--clarify-ui-accent-border) transition-colors hover:bg-(--clarify-theme-tokens-colors-foreground) hover:text-(--clarify-theme-tokens-colors-background) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-foreground) focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60'}
    >
      {busy ? <LoaderCircleIcon className="size-4 animate-spin" aria-hidden="true" /> : <SendIcon className="size-4" aria-hidden="true" />}
      {text}
    </button>
  )
}
