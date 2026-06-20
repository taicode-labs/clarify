import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

export function CheckmarkIcon({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 13 13"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      role="image"
      className={clsx('inline-block', className)}
      {...props}
    >
      <path d="M1.5 6.5L5.5 11.5L11.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
