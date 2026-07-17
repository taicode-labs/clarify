import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'

import { Section } from '../elements/section'

type StatProps = { stat: ReactNode; text: ReactNode } & ComponentProps<'div'>
type StatsFourColumnsProps = ComponentProps<typeof Section>

export function Stat(arg0: StatProps) {  const {
  stat,
  text,
  className,
  ...props
} = arg0

  return (
    <div className={clsx('rounded-xl bg-(--clarify-ui-subtle-background) p-6', className)} {...props}>
      <div className="text-2xl/10 tracking-tight text-(--clarify-ui-text-strong)">{stat}</div>
      <p className="mt-2 text-sm/7 text-(--clarify-ui-text-soft)">{text}</p>
    </div>
  )
}

export function StatsFourColumns(arg0: StatsFourColumnsProps) {  const { children, ...props } = arg0

  return (
    <Section {...props}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </Section>
  )
}
