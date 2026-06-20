import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

export function CodeSquareIcon({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 13 13"
      fill="none"
      strokeWidth={1}
      role="image"
      className={clsx('inline-block', className)}
      {...props}
    >
      <path
        d="M0.5 1.5C0.5 0.947715 0.947715 0.5 1.5 0.5H11.5C12.0523 0.5 12.5 0.947715 12.5 1.5V11.5C12.5 12.0523 12.0523 12.5 11.5 12.5H1.5C0.947715 12.5 0.5 12.0523 0.5 11.5V1.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 5L3.5 6.5L5 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 5L9.5 6.49981L8 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
