import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

export function ChevronIcon({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      width={5}
      height={8}
      viewBox="0 0 5 8"
      fill="currentColor"
      role="image"
      className={clsx('inline-block', className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M.22.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06L1.28 7.78A.75.75 0 01.22 6.72L2.94 4 .22 1.28a.75.75 0 010-1.06z"
      />
    </svg>
  )
}
