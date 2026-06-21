import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'

import { Section } from '../elements/section'

type FeatureProps = {
  icon?: ReactNode
  headline: ReactNode
  subheadline: ReactNode
} & ComponentProps<'div'>

type FeaturesThreeColumnProps = {
  demo?: ReactNode
  features: ReactNode
} & Omit<ComponentProps<typeof Section>, 'children'>

export function Feature(arg0: FeatureProps) {  const {
  icon,
  headline,
  subheadline,
  className,
  ...props
} = arg0

  return (
    <div className={clsx('flex flex-col gap-2 text-sm/7', className)} {...props}>
      <div className="flex items-start gap-3 text-(--clarify-ui-text-strong)">
        {icon && <div className="flex size-3.25 h-lh items-center">{icon}</div>}
        <h3 className="font-semibold">{headline}</h3>
      </div>
      <div className="flex flex-col gap-4 text-(--clarify-ui-text-soft)">{subheadline}</div>
    </div>
  )
}

export function FeaturesThreeColumn(arg0: FeaturesThreeColumnProps) {  const {
  features,
  ...props
} = arg0

  return (
    <Section {...props}>
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">{features}</div>
    </Section>
  )
}
