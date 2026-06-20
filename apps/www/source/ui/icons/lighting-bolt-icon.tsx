import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

export function LightingBoltIcon({ className, ...props }: ComponentProps<'svg'>) {
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
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="m.5 7.5 8-7-2 5h6l-8 7 2-5h-6Z" />
    </svg>
  )
}
