import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

export function XIcon({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="currentColor"
      role="image"
      className={clsx('inline-block', className)}
      {...props}
    >
      <path d="M13.6833 10.6218L20.2401 3H18.6864L12.9931 9.61788L8.44583 3H3.20117L10.0775 13.0074L3.20117 21H4.75501L10.7673 14.0113L15.5695 21H20.8141L13.6833 10.6218ZM11.5551 13.0956L10.8584 12.0991L5.31488 4.16971H7.7015L12.1752 10.5689L12.8719 11.5655L18.6871 19.8835H16.3005L11.5551 13.0956Z" />
    </svg>
  )
}
