import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'

import { Section } from '../elements/section'

type FeatureWithDemoProps = {
  demo: ReactNode
  headline: ReactNode
  subheadline: ReactNode
  cta: ReactNode
} & Omit<ComponentProps<'div'>, 'children'>

type FeaturesTwoColumnWithDemosProps = {
  features: ReactNode
} & Omit<ComponentProps<typeof Section>, 'children'>

export function FeatureWithDemo(arg0: FeatureWithDemoProps) {  const {
  demo,
  headline,
  subheadline,
  cta,
  className,
} = arg0

  return (
    <div className={clsx('flex h-full flex-col rounded-lg bg-(--clarify-ui-subtle-background) p-2', className)}>
      <div className="relative h-[26rem] overflow-hidden rounded-sm ring-1 ring-(--clarify-theme-tokens-colors-border) sm:h-[28rem] lg:h-[27rem]">
        {demo}
      </div>
      <div className="flex flex-1 flex-col justify-between gap-4 p-6 sm:p-10 lg:p-6">
        <div>
          <h3 className="text-base/8 font-medium text-(--clarify-ui-text-strong)">{headline}</h3>
          <div className="mt-2 flex flex-col gap-4 text-sm/7 text-(--clarify-ui-text-soft)">{subheadline}</div>
        </div>
        <div className="self-start">{cta}</div>
      </div>
    </div>
  )
}

export function FeaturesTwoColumnWithDemos(arg0: FeaturesTwoColumnWithDemosProps) {  const {
  features,
  ...props
} = arg0

  return (
    <Section {...props}>
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">{features}</div>
    </Section>
  )
}
