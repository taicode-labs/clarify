import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

export function GitBranchIcon({ className, ...props }: ComponentProps<'svg'>) {
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
      <path d="M2.5 3.5V9.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M8.5 5.5C8.5 6.36558 7.87422 7.1043 7.02041 7.2466L3.97959 7.7534C3.12579 7.8957 2.5 8.63442 2.5 9.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 2C4 2.82843 3.32843 3.5 2.5 3.5C1.67157 3.5 1 2.82843 1 2C1 1.17157 1.67157 0.5 2.5 0.5C3.32843 0.5 4 1.17157 4 2Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <path
        d="M10 4C10 4.82843 9.32843 5.5 8.5 5.5C7.67157 5.5 7 4.82843 7 4C7 3.17157 7.67157 2.5 8.5 2.5C9.32843 2.5 10 3.17157 10 4Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <path
        d="M4 11C4 11.8284 3.32843 12.5 2.5 12.5C1.67157 12.5 1 11.8284 1 11C1 10.1716 1.67157 9.5 2.5 9.5C3.32843 9.5 4 10.1716 4 11Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  )
}
