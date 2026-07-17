import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'

import { ChevronIcon } from '../../../components/icons/chevron-icon'
import Link from '../../../components/primitives/router-link'

type AnnouncementBadgeProps = {
  text: ReactNode
  href: string
  cta?: ReactNode
  variant?: 'normal' | 'overlay'
} & Omit<ComponentProps<'a'>, 'href' | 'children'>

export function AnnouncementBadge(arg0: AnnouncementBadgeProps) {
  const {
    text,
    href,
    cta = 'Learn more',
    variant = 'normal',
    className,
    ...props
  } = arg0

  return (
    <Link
      href={href}
      {...props}
      data-variant={variant}
      className={clsx(
        'group relative inline-flex max-w-full gap-x-3 overflow-hidden rounded-md px-3.5 py-2 text-sm/6 transition max-sm:flex-col sm:items-center sm:rounded-full sm:px-3 sm:py-0.5',
        variant === 'normal' &&
          'bg-(--clarify-ui-hover-background) text-(--clarify-ui-text-strong) hover:bg-(--clarify-ui-active-background) inset-ring-1 inset-ring-(--clarify-theme-tokens-colors-border)',
        variant === 'overlay' &&
          'bg-(--clarify-ui-overlay-background) text-(--clarify-ui-text-strong) hover:bg-(--clarify-ui-hover-background) inset-ring-1 inset-ring-(--clarify-theme-tokens-colors-border)',
        className,
      )}
    >
      <span className="text-pretty sm:truncate">{text}</span>
      <span
        className={clsx(
          'h-3 w-px max-sm:hidden',
          variant === 'normal' && 'bg-(--clarify-theme-tokens-colors-border)',
          variant === 'overlay' && 'bg-(--clarify-theme-tokens-colors-border)',
        )}
      />
      <span
        className={clsx(
          'inline-flex shrink-0 items-center gap-2 font-semibold',
          variant === 'normal' && 'text-(--clarify-ui-text-strong)',
        )}
      >
        {cta} <ChevronIcon className="shrink-0" />
      </span>
    </Link>
  )
}
