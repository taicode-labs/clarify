import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

export function Main(arg0: ComponentProps<'main'>) {  const { children, className, ...props } = arg0

  return (
    <main className={clsx('isolate overflow-clip', className)} {...props}>
      {children}
    </main>
  )
}
