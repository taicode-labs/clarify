import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

export function Document2StackedIcon({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      width={11}
      height={13}
      viewBox="0 0 11 13"
      fill="none"
      strokeWidth={1}
      role="image"
      className={clsx('inline-block', className)}
      {...props}
    >
      <path
        d="M3.5 3.5V0.5H6.5C8.70914 0.5 10.5 2.29086 10.5 4.5V9.5H7.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0.5 12.5H7.5V7.5C7.5 5.29086 5.70914 3.5 3.5 3.5H0.5V12.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 5.5C10.5 4.39543 9.60457 3.5 8.5 3.5H7.5V2.5C7.5 1.39543 6.60457 0.5 5.5 0.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 8.5C7.5 7.39543 6.60457 6.5 5.5 6.5H4.5V5.5C4.5 4.39543 3.60457 3.5 2.5 3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 3.5V2.5C7.5 1.39543 6.60457 0.5 5.5 0.5H6.5C8.70914 0.5 10.5 2.29086 10.5 4.5V5.5C10.5 4.39543 9.60457 3.5 8.5 3.5H7.5Z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path
        d="M4.5 6.5V5.5C4.5 4.39543 3.60457 3.5 2.5 3.5H3.5C5.70914 3.5 7.5 5.29086 7.5 7.5V8.5C7.5 7.39543 6.60457 6.5 5.5 6.5H4.5Z"
        fill="currentColor"
        fillOpacity="0.2"
      />
    </svg>
  )
}
