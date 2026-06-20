import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'

import { Container } from '../elements/container'
import { Heading } from '../elements/heading'
import { Text } from '../elements/text'
import { CheckmarkIcon } from '../icons/checkmark-icon'
import { TabGroup, TabList, TabPanels } from '../primitives/interactive'

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
      {cta}
    </div>
  )
}

export function PricingHeroMultiTier<T extends string>(arg0: {
  eyebrow?: ReactNode
  headline: ReactNode
  subheadline: ReactNode
  options: readonly T[]
  plans: Record<T, ReactNode>
  footer?: ReactNode
} & ComponentProps<'section'>) {  const {
  eyebrow,
  headline,
  subheadline,
  options,
  plans,
  footer,
  className,
  ...props
} = arg0

  return (
    <section className={clsx('py-16', className)} {...props}>
      <TabGroup>
        <Container className="flex flex-col gap-16">
          <div className="flex flex-col items-center gap-6">
            {eyebrow}
            <Heading>{headline}</Heading>
            <Text size="lg" className="flex max-w-xl flex-col gap-4 text-center">
              {subheadline}
            </Text>
            <TabList className="flex items-center gap-1 rounded-full bg-(--clarify-ui-hover-background) p-1">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="rounded-full px-4 py-1 text-sm/7 font-medium text-(--clarify-ui-text-strong) aria-selected:bg-(--clarify-ui-text-strong) aria-selected:text-(--clarify-theme-tokens-colors-background) dark:aria-selected:bg-white dark:aria-selected:text-zinc-950"
                >
                  {option}
                </button>
              ))}
            </TabList>
          </div>
          <TabPanels>
            {options.map((option) => (
              <div
                key={option}
                className="grid grid-cols-1 gap-2 sm:has-[>:nth-child(5)]:grid-cols-2 sm:max-lg:has-[>:last-child:nth-child(even)]:grid-cols-2 lg:auto-cols-fr lg:grid-flow-col lg:grid-cols-none lg:has-[>:nth-child(5)]:grid-flow-row lg:has-[>:nth-child(5)]:grid-cols-3"
              >
                {plans[option]}
              </div>
            ))}
          </TabPanels>
          {footer}
        </Container>
      </TabGroup>
    </section>
  )
}
