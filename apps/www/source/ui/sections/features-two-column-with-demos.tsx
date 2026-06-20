import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'
import { Section } from '../elements/section'

export function FeatureWithDemo({
  demo,
  headline,
  subheadline,
  cta,
  className,
}: {
  demo: ReactNode
  headline: ReactNode
  subheadline: ReactNode
  cta: ReactNode
} & Omit<ComponentProps<'div'>, 'children'>) {
  return (
    <div className={clsx('flex h-full flex-col rounded-lg bg-mist-950/2.5 p-2 dark:bg-white/5', className)}>
      <div className="relative h-[26rem] overflow-hidden rounded-sm sm:h-[28rem] lg:h-[27rem] dark:after:absolute dark:after:inset-0 dark:after:rounded-sm dark:after:outline-1 dark:after:-outline-offset-1 dark:after:outline-white/10">
        {demo}
      </div>
      <div className="flex flex-1 flex-col justify-between gap-4 p-6 sm:p-10 lg:p-6">
        <div>
          <h3 className="text-base/8 font-medium text-mist-950 dark:text-white">{headline}</h3>
          <div className="mt-2 flex flex-col gap-4 text-sm/7 text-mist-700 dark:text-mist-400">{subheadline}</div>
        </div>
        <div className="self-start">{cta}</div>
      </div>
    </div>
  )
}

export function FeaturesTwoColumnWithDemos({
  features,
  ...props
}: { features: ReactNode } & Omit<ComponentProps<typeof Section>, 'children'>) {
  return (
    <Section {...props}>
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">{features}</div>
    </Section>
  )
}
