import clsx from 'clsx'
import type { ComponentPropsWithoutRef, ElementType } from 'react'

type ProseProps<T extends ElementType = 'div'> = Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'> & {
  as?: T
  className?: string
}

export function Prose<T extends ElementType = 'div'>(arg0: ProseProps<T>) {
  const { as, className, ...props } = arg0
  const Component = as ?? 'div'

  return (
    <Component
      className={clsx(
        className,
        'clarify-prose prose max-w-none min-w-0 dark:prose-invert wrap-break-word',
        '[html_:where(&>*)]:w-full [html_:where(&>*)]:min-w-0 [html_:where(&>*)]:max-w-full',
      )}
      {...props}
    />
  )
}
