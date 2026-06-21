import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'
import { type ComponentPropsWithoutRef, type ReactNode, useLayoutEffect, useRef, useState } from 'react'

export type CollapseProps = {
  children?: ReactNode
  title?: ReactNode
  summary?: ReactNode
  defaultOpen?: boolean
  className?: string
} & Omit<ComponentPropsWithoutRef<'details'>, 'children' | 'className' | 'open'>

export function Collapse(arg0: CollapseProps) {
  const { children, title, summary, defaultOpen = false, className, ...props } = arg0
  const [open, setOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [maxHeight, setMaxHeight] = useState('0px')
  const summaryLabel = title ?? summary ?? 'Details'

  useLayoutEffect(() => {
    if (!contentRef.current) return
    setMaxHeight(open ? `${contentRef.current.scrollHeight}px` : '0px')
  }, [open, children])

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className={clsx(
        'clarify-collapse my-6 overflow-hidden rounded-(--clarify-theme-tokens-radius-xl) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) shadow-sm dark:border-white/10 dark:bg-zinc-900/50',
        className,
      )}
      {...props}
    >
      <summary
        className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-(--clarify-theme-tokens-colors-foreground) transition hover:bg-(--clarify-ui-hover-background) dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--clarify-theme-tokens-colors-background) dark:focus-visible:ring-offset-zinc-950"
        aria-expanded={open}
        style={{ listStyle: 'none' }}
      >
        <span>{summaryLabel}</span>
        <ChevronDown
          className={clsx(
            'h-4 w-4 text-(--clarify-theme-tokens-colors-muted) transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </summary>
      <div
        ref={contentRef}
        className={clsx(
          'overflow-hidden border-t border-(--clarify-theme-tokens-border) bg-(--clarify-theme-tokens-colors-surface) px-4 py-4 text-sm/6 text-(--clarify-theme-tokens-colors-foreground) transition-[max-height,opacity,transform] duration-200 ease-out dark:bg-zinc-950/60',
          open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1',
        )}
        style={{ maxHeight, willChange: 'max-height, opacity, transform' }}
      >
        {children}
      </div>
    </details>
  )
}
