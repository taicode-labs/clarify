import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'

import { Section } from '../elements/section'
import { CheckmarkIcon } from '../icons/checkmark-icon'

export function Plan(arg0: {
  name: ReactNode
  price: ReactNode
  period?: ReactNode
  subheadline: ReactNode
  badge?: ReactNode
  features: ReactNode[]
  cta: ReactNode
} & ComponentProps<'div'>) {  const {
  name,
  price,
  period,
  subheadline,
  badge,
  features,
  cta,
  className,
} = arg0

  return (
    <div
      className={clsx(
        'flex flex-col justify-between gap-6 rounded-xl bg-(--clarify-ui-subtle-background) p-6 sm:items-start',
        className,
      )}
    >
      <div className="self-stretch">
        <div className="flex items-center justify-between">
          {badge && (
            <div className="order-last inline-flex rounded-full bg-(--clarify-ui-hover-background) px-2 text-xs/6 font-medium text-(--clarify-ui-text-strong)">
              {badge}
            </div>
          )}

          <h3 className="text-2xl/8 tracking-tight text-(--clarify-ui-text-strong)">{name}</h3>
        </div>
        <p className="mt-1 inline-flex gap-1 text-base/7">
          <span className="text-(--clarify-ui-text-strong)">{price}</span>
          {period && <span className="text-(--clarify-ui-text-faint)">{period}</span>}
        </p>
        <div className="mt-4 flex flex-col gap-4 text-sm/6 text-(--clarify-ui-text-soft)">{subheadline}</div>
        <ul className="mt-4 space-y-2 text-sm/6 text-(--clarify-ui-text-soft)">
          {features.map((feature, index) => (
            <li key={index} className="flex gap-4">
              <CheckmarkIcon className="h-lh shrink-0 stroke-(--clarify-ui-text-strong)" />
              <p>{feature}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="self-start">{cta}</div>
    </div>
  )
}

export function PricingMultiTier(arg0: {
  plans: ReactNode
} & ComponentProps<typeof Section>) {  const {
  plans,
  ...props
} = arg0

  return (
    <Section {...props}>
      <div className="grid grid-cols-1 gap-2 sm:has-[>:nth-child(5)]:grid-cols-2 sm:max-lg:has-[>:last-child:nth-child(even)]:grid-cols-2 lg:auto-cols-fr lg:grid-flow-col lg:grid-cols-none lg:has-[>:nth-child(5)]:grid-flow-row lg:has-[>:nth-child(5)]:grid-cols-3">
        {plans}
      </div>
    </Section>
  )
}
