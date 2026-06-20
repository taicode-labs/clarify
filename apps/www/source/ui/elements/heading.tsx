import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

export function Heading({
  children,
  color = 'dark/light',
  className,
  ...props
}: { color?: 'dark/light' | 'light' } & ComponentProps<'h1'>) {
  return (
    <h1
      className={clsx(
        'www-heading-display text-balance',
        color === 'dark/light' && 'text-mist-950 dark:text-white',
        color === 'light' && 'text-white',
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  )
}
