import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

export function PlusIcon({ className, ...props }: ComponentProps<'svg'>) {
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
      <path d="M6.5 0.5V12.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5049 6.49512L0.504883 6.49512" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
