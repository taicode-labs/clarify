import { clsx } from 'clsx/lite'
import { type ComponentProps, type ReactNode } from 'react'

import { Container } from '../elements/container'
import { CheckmarkIcon } from '../icons/checkmark-icon'
import { MinusIcon } from '../icons/minus-icon'
import { TabGroup, TabList, TabPanels } from '../primitives/interactive'

function FeatureGroup<Plan extends string>(arg0: {
  group: {
    title: ReactNode
    features: { name: ReactNode; value: ReactNode | Record<Plan, ReactNode> }[]
  }
  plans: Plan[]
  includedLabel: string
  notIncludedLabel: string
}) {  const {
  group,
  plans,
  includedLabel,
  notIncludedLabel,
} = arg0

  return (
    <tbody>
      <tr>
        <th
          colSpan={plans.length + 1}
          scope="colgroup"
          className="border-t border-b border-(--clarify-theme-tokens-colors-border) pt-14 pb-4 font-semibold text-(--clarify-ui-text-strong)"
        >
          {group.title}
        </th>
      </tr>
      {group.features.map((feature) => (
        <tr key={String(feature.name)} className="group">
          <th
            scope="row"
            className="border-t border-(--clarify-theme-tokens-colors-border) py-4 pr-3 font-normal text-(--clarify-ui-text-soft)"
          >
            {feature.name}
          </th>
          {plans.map((plan) => {
            const value = isPlanValue(feature.value, plan) ? feature.value[plan] : feature.value

            return (
              <td
                key={plan}
                className="border-t border-(--clarify-theme-tokens-colors-border) px-3 py-4 text-center text-(--clarify-ui-text-soft)"
              >
                {value === true ? (
                  <CheckmarkIcon aria-label={includedLabel} className="stroke-(--clarify-ui-text-strong)" />
                ) : value === false ? (
                  <MinusIcon aria-label={notIncludedLabel} className="stroke-(--clarify-ui-text-strong)" />
                ) : (
                  value
                )}
              </td>
            )
          })}
        </tr>
      ))}
    </tbody>
  )
}

function isPlanValue<Plan extends string>(value: ReactNode | Record<Plan, ReactNode>, plan: Plan): value is Record<Plan, ReactNode> {
  return typeof value === 'object' && value !== null && plan in value
}

export function PlanComparisonTable<const Plan extends string>(arg0: {
  plans: Plan[]
  features: {
    title: ReactNode
    features: { name: ReactNode; value: ReactNode | Record<Plan, ReactNode> }[]
  }[]
  compareLabel?: ReactNode
  includedLabel?: string
  notIncludedLabel?: string
} & ComponentProps<'section'>) {  const {
  plans,
  features,
  compareLabel = 'Compare features',
  includedLabel = 'Included',
  notIncludedLabel = 'Not included',
  className,
  ...props
} = arg0

  return (
    <section className={clsx('py-16', className)} {...props}>
      <Container>
        <table className="w-full border-collapse text-left text-sm/5 max-sm:hidden">
          <colgroup>
            <col className="w-2/5" />
            {plans.map((plan) => (
              <col key={plan} style={{ width: `calc(60% / ${plans.length})` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="sticky top-(--scroll-padding-top) bg-(--clarify-theme-tokens-colors-background) py-5 pr-3 text-base/7 font-medium text-(--clarify-ui-text-strong)">
                {compareLabel}
              </th>
              {plans.map((plan, index) => (
                <th
                  key={index}
                  className="sticky top-(--scroll-padding-top) bg-(--clarify-theme-tokens-colors-background) p-3 text-center font-semibold text-(--clarify-ui-text-strong)"
                >
                  {plan}
                </th>
              ))}
            </tr>
          </thead>
          {features.map((group, index) => (
            <FeatureGroup key={index} group={group} plans={plans} includedLabel={includedLabel} notIncludedLabel={notIncludedLabel} />
          ))}
        </table>

        <div className="sm:hidden">
          <TabGroup>
            <TabList className="flex gap-6">
              {plans.map((plan) => (
                <button
                  key={plan}
                  type="button"
                  className="relative -mb-px flex-1 border-b border-b-transparent px-2 py-6 text-sm/5 font-medium text-(--clarify-ui-text-faint) aria-selected:border-(--clarify-ui-text-strong) aria-selected:text-(--clarify-ui-text-strong)"
                >
                  {plan}
                </button>
              ))}
            </TabList>
            <TabPanels>
              {plans.map((plan) => (
                <table key={plan} className="w-full border-collapse text-left text-sm/5">
                  <colgroup>
                    <col className="w-3/4" />
                    <col className="w-1/4" />
                  </colgroup>
                  {features.map((group, index) => (
                    <FeatureGroup key={index} group={group} plans={[plan]} includedLabel={includedLabel} notIncludedLabel={notIncludedLabel} />
                  ))}
                </table>
              ))}
            </TabPanels>
          </TabGroup>
        </div>
      </Container>
    </section>
  )
}
