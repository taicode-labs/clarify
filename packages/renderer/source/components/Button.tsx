import clsx from 'clsx'
import { ArrowRight } from 'lucide-react'
import type { ComponentPropsWithoutRef } from 'react'

import { LocalizedLink } from './LocalizedLink'

const buttonVariantStyles = {
  primary:
    'bg-(--clarify-theme-tokens-colors-foreground) px-4 text-(--clarify-theme-tokens-colors-background) shadow-sm hover:-translate-y-px hover:shadow-md active:translate-y-0 active:shadow-sm dark:bg-(--clarify-theme-tokens-colors-primary) dark:text-zinc-950',
  secondary:
    'bg-(--clarify-theme-tokens-colors-code-background) px-4 text-(--clarify-ui-text-soft) ring-1 ring-inset ring-(--clarify-theme-tokens-colors-border) hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-theme-tokens-colors-foreground)',
  filled:
    'bg-(--clarify-theme-tokens-colors-primary) px-4 text-white shadow-sm hover:-translate-y-px hover:shadow-md active:translate-y-0 dark:text-zinc-950',
  outline:
    'px-4 text-(--clarify-ui-text-soft) ring-1 ring-inset ring-(--clarify-theme-tokens-colors-border) hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-theme-tokens-colors-foreground)',
  text: 'text-(--clarify-theme-tokens-colors-primary) hover:opacity-80 dark:text-(--clarify-theme-tokens-colors-primary) dark:hover:opacity-80',
}

export type ButtonProps = {
  variant?: keyof typeof buttonVariantStyles
  arrow?: 'left' | 'right'
} & (
  | (ComponentPropsWithoutRef<'a'> & { href: string })
  | (ComponentPropsWithoutRef<'button'> & { href?: undefined })
)

export function Button(arg0: ButtonProps) {
  const { variant = 'primary', className, children, arrow, ...props } = arg0

  const classes = clsx(
    'clarify-button not-prose inline-flex w-fit max-w-full items-center justify-center gap-1.5 overflow-hidden align-middle text-sm font-semibold whitespace-nowrap no-underline transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--clarify-theme-tokens-colors-background)',
    variant === 'text' ? 'h-auto rounded-sm' : 'h-9 rounded-(--clarify-theme-tokens-radius-lg)',
    buttonVariantStyles[variant],
    className,
  )

  const arrowIcon = (
    <ArrowRight
      aria-hidden="true"
      className={clsx(
        'h-4 w-4 shrink-0',
        variant === 'text' && 'relative top-px',
        arrow === 'left' && '-ml-0.5 rotate-180',
        arrow === 'right' && '-mr-0.5',
      )}
    />
  )

  const inner = (
    <>
      {arrow === 'left' ? arrowIcon : null}
      <span className="truncate">{children}</span>
      {arrow === 'right' ? arrowIcon : null}
    </>
  )

  if (typeof props.href === 'undefined') {
    return (
      <button className={classes} {...props}>
        {inner}
      </button>
    )
  }

  return (
    <LocalizedLink className={classes} {...props}>
      {inner}
    </LocalizedLink>
  )
}
