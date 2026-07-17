import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

type TextProps = ComponentProps<'div'> & {
  size?: 'md' | 'lg'
}

export function Text(arg0: TextProps) {
  const { children, className, size = 'md', ...props } = arg0

  return (
    <div
      className={clsx(
        size === 'md' && 'text-base/7',
        size === 'lg' && 'text-lg/8',
        'text-(--clarify-ui-text-soft)',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
