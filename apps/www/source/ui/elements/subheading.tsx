import { clsx } from 'clsx/lite'
import { type ComponentProps } from 'react'

export function Subheading(arg0: ComponentProps<'h2'>) {  const { children, className, ...props } = arg0

  return (
    <h2
      className={clsx(
        'www-subheading-display text-pretty text-(--clarify-ui-text-strong)',
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  )
}
