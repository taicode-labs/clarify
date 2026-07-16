import clsx from 'clsx'
import { type ComponentPropsWithoutRef, type CSSProperties, type ReactNode, useEffect, useId, useRef, useState } from 'react'

export type TooltipProps = {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom'
  triggerClassName?: string
} & Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'content'>

export function Tooltip(arg0: TooltipProps) {
  const { content, children, side = 'top', className, triggerClassName, ...props } = arg0
  const contentId = useId()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const [position, setPosition] = useState<CSSProperties>()

  useEffect(() => {
    if (!open) return

    function updatePosition() {
      const bounds = triggerRef.current?.getBoundingClientRect()
      if (!bounds) return
      setPosition({
        left: bounds.left + bounds.width / 2,
        top: side === 'top' ? bounds.top - 8 : bounds.bottom + 8,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, side])

  useEffect(() => {
    const tooltip = tooltipRef.current
    if (!tooltip || typeof tooltip.showPopover !== 'function') return
    if (open) tooltip.showPopover()
    else if (tooltip.matches(':popover-open')) tooltip.hidePopover()
  }, [open])

  return (
    <span
      className={clsx('clarify-tooltip group inline-flex align-baseline', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      <button
        type="button"
        ref={triggerRef}
        aria-describedby={contentId}
        aria-expanded={open}
        className={clsx('cursor-help appearance-none rounded-sm border-0 border-b border-dotted border-current bg-transparent p-0 font-inherit text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary)', triggerClassName)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
      >
        {children}
      </button>
      <span
        ref={tooltipRef}
        id={contentId}
        role="tooltip"
        popover="manual"
        style={position}
        className={clsx(
          'pointer-events-none fixed right-auto bottom-auto z-60 m-0 w-max max-w-64 -translate-x-1/2 rounded-md border-0 bg-(--clarify-theme-tokens-colors-foreground) px-2.5 py-1.5 text-center text-xs/5 font-normal text-(--clarify-theme-tokens-colors-background) shadow-lg transition duration-150',
          side === 'top' && '-translate-y-full',
          open && position ? 'visible opacity-100' : 'invisible opacity-0',
        )}
      >
        {content}
      </span>
    </span>
  )
}
