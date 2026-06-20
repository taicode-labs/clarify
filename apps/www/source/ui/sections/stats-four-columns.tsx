import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'
import { Section } from '../elements/section'

export function Stat({
  stat,
  text,
  className,
  ...props
}: { stat: ReactNode; text: ReactNode } & ComponentProps<'div'>) {
  return (
    <div className={clsx('rounded-xl bg-mist-950/2.5 p-6 dark:bg-white/5', className)} {...props}>
      <div className="text-2xl/10 tracking-tight text-mist-950 dark:text-white">{stat}</div>
      <p className="mt-2 text-sm/7 text-mist-700 dark:text-mist-400">{text}</p>
    </div>
  )
}

export function StatsFourColumns({ children, ...props }: ComponentProps<typeof Section>) {
  return (
    <Section {...props}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </Section>
  )
}
