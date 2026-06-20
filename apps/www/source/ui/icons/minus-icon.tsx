import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

export function MinusIcon({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      width={13}
      height={1}
      viewBox="0 0 13 1"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      role="image"
      className={clsx('inline-block', className)}
      {...props}
    >
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M12.505.5h-12" />
    </svg>
  )
}
