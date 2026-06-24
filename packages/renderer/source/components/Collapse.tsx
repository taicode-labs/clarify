import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'
import { type ComponentPropsWithoutRef, type ReactNode, useId, useLayoutEffect, useRef, useState } from 'react'

export type CollapseProps = {
  children?: ReactNode
  title?: ReactNode
  summary?: ReactNode
  defaultOpen?: boolean
  className?: string
} & Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>

export function Collapse(arg0: CollapseProps) {
  const { children, title, summary, defaultOpen = false, className, ...props } = arg0
  const [open, setOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [maxHeight, setMaxHeight] = useState('0px')
  const summaryLabel = title ?? summary ?? 'Details'
  const contentId = useId()

  useLayoutEffect(() => {
    if (!contentRef.current) return
    setMaxHeight(open ? `${contentRef.current.scrollHeight}px` : '0px')
  }, [open, children])

  return (
    <div
      className={clsx(
        'clarify-collapse my-6 overflow-hidden rounded-(--clarify-theme-tokens-radius-xl) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface)',
        className,
      )}
      {...props}
    >
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-(--clarify-theme-tokens-colors-foreground) transition hover:bg-(--clarify-ui-hover-background) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--clarify-theme-tokens-colors-background)"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{summaryLabel}</span>
        <ChevronDown
          className={clsx(
            'h-4 w-4 text-(--clarify-theme-tokens-colors-muted) transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>
      <div
        id={contentId}
        className="clarify-collapse-content overflow-hidden border-t border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-background) duration-200 ease-out"
        style={{ maxHeight, willChange: 'max-height, opacity, transform' }}
      >
        <div
          ref={contentRef}
          className={clsx(
            'px-4 py-4 text-sm/6 text-(--clarify-theme-tokens-colors-foreground) transition-opacity duration-200 ease-out',
            open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1',
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
