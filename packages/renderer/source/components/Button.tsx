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
    'clarify-button inline-flex justify-center gap-0.5 overflow-hidden text-sm font-medium transition',
    buttonVariantStyles[variant],
    className,
  )

  const arrowIcon = (
    <ArrowRight
      className={clsx(
        'mt-0.5 h-5 w-5',
        variant === 'text' && 'relative top-px',
        arrow === 'left' && '-ml-1 rotate-180',
        arrow === 'right' && '-mr-1',
      )}
    />
  )

  const inner = (
    <>
      {arrow === 'left' ? arrowIcon : null}
      {children}
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
