import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

export function Eyebrow(arg0: ComponentProps<'div'>) {  const { children, className, ...props } = arg0

  return (
    <div className={clsx('text-sm/7 font-semibold text-(--clarify-ui-text-soft)', className)} {...props}>
      {children}
    </div>
  )
}
