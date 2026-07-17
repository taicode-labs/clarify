import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

type HeadingProps = {
  color?: 'dark/light' | 'light'
} & ComponentProps<'h1'>

export function Heading(arg0: HeadingProps) {
  const {
    children,
    color = 'dark/light',
    className,
    ...props
  } = arg0

  return (
    <h1
      className={clsx(
        'www-heading-display text-balance',
        color === 'dark/light' && 'text-(--clarify-ui-text-strong)',
        color === 'light' && 'text-white',
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  )
}
