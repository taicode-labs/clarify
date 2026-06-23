import clsx from 'clsx'
import { ArrowRight } from 'lucide-react'
import type { ComponentPropsWithoutRef } from 'react'

const buttonVariantStyles = {
  primary:
    'rounded-full bg-(--clarify-theme-tokens-colors-foreground) px-3 py-1 text-(--clarify-theme-tokens-colors-background) hover:opacity-80 dark:bg-(--clarify-theme-tokens-colors-primary)/10 dark:text-(--clarify-theme-tokens-colors-primary) dark:ring-1 dark:ring-inset dark:ring-(--clarify-theme-tokens-colors-primary)/20 dark:hover:opacity-80',
  secondary:
    'rounded-full bg-(--clarify-theme-tokens-colors-code-background) px-3 py-1 text-(--clarify-ui-text-soft) ring-1 ring-inset ring-(--clarify-theme-tokens-colors-border) hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-theme-tokens-colors-foreground)',
  filled:
    'rounded-full bg-(--clarify-theme-tokens-colors-foreground) px-3 py-1 text-(--clarify-theme-tokens-colors-background) hover:opacity-80 dark:bg-(--clarify-theme-tokens-colors-primary) dark:hover:opacity-80',
  outline:
    'rounded-full px-3 py-1 text-(--clarify-ui-text-soft) ring-1 ring-inset ring-(--clarify-theme-tokens-colors-border) hover:bg-(--clarify-ui-hover-background) hover:text-(--clarify-theme-tokens-colors-foreground)',
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
    'clarify-button not-prose inline-flex w-fit max-w-full items-center justify-center gap-1 overflow-hidden align-middle text-sm leading-6 font-medium whitespace-nowrap no-underline transition',
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
    <a className={classes} {...props}>
      {inner}
    </a>
  )
}
