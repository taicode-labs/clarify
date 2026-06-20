import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

export function Eyebrow({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={clsx('text-sm/7 font-semibold text-mist-700 dark:text-mist-400', className)} {...props}>
      {children}
    </div>
  )
}
