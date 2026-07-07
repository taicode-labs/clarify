import type { ReactNode } from 'react'

type ChromeProps = {
  title: string
  status?: string
  headerAction?: ReactNode
  children: ReactNode
}

export function Chrome(arg0: ChromeProps) {
  const { title, status, headerAction, children } = arg0

  return (
    <div className="clarify-app clarify-preview h-full overflow-hidden bg-(--clarify-theme-tokens-colors-background) text-(--clarify-ui-text) shadow-2xl ring-1 ring-(--clarify-theme-tokens-colors-border) dark:bg-zinc-950 dark:text-white dark:ring-white/10">
      <div className="flex items-center gap-3 border-b border-(--clarify-theme-tokens-colors-border) px-4 py-3 text-xs/6 text-(--clarify-ui-text-faint) dark:border-white/10">
        <span className="size-2 rounded-full bg-rose-400" />
        <span className="size-2 rounded-full bg-amber-400" />
        <span className="size-2 rounded-full bg-emerald-400" />
        <span className="ml-2 min-w-0 flex-1 truncate font-medium text-(--clarify-ui-text-soft)">{title}</span>
        {status ? <span className="hidden rounded-full bg-emerald-400/15 px-2 py-0.5 font-medium text-emerald-700 sm:inline dark:text-emerald-300">{status}</span> : null}
        {headerAction}
      </div>
      {children}
    </div>
  )
}
