import clsx from 'clsx'
import { type ComponentPropsWithoutRef, type ReactNode, useId, useState } from 'react'

export type TooltipProps = {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom'
} & Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'content'>

export function Tooltip(arg0: TooltipProps) {
  const { content, children, side = 'top', className, ...props } = arg0
  const contentId = useId()
  const [open, setOpen] = useState(false)

  return (
    <span
      className={clsx('clarify-tooltip group relative inline-flex align-baseline', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      <span
        tabIndex={0}
        aria-describedby={contentId}
        className="cursor-help rounded-sm border-b border-dotted border-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
      >
        {children}
      </span>
      <span
        id={contentId}
        role="tooltip"
        className={clsx(
          'pointer-events-none absolute left-1/2 z-30 w-max max-w-64 -translate-x-1/2 rounded-md bg-(--clarify-theme-tokens-colors-foreground) px-2.5 py-1.5 text-center text-xs/5 font-normal text-(--clarify-theme-tokens-colors-background) shadow-lg transition duration-150',
          open ? 'opacity-100' : 'opacity-0',
          side === 'top' ? 'bottom-[calc(100%+0.5rem)]' : 'top-[calc(100%+0.5rem)]',
        )}
      >
        {content}
      </span>
    </span>
  )
}
