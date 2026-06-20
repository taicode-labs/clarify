import { clsx } from 'clsx/lite'
import { type ComponentProps, type ReactNode } from 'react'

import { Container } from '../elements/container'
import { CheckmarkIcon } from '../icons/checkmark-icon'
import { MinusIcon } from '../icons/minus-icon'
import { TabGroup, TabList, TabPanels } from '../primitives/interactive'

function FeatureGroup<Plan extends string>({
  group,
  plans,
  includedLabel,
  notIncludedLabel,
}: {
  group: {
    title: ReactNode
    features: { name: ReactNode; value: ReactNode | Record<Plan, ReactNode> }[]
  }
  plans: Plan[]
  includedLabel: string
  notIncludedLabel: string
}) {
  return (
    <tbody>
      <tr>
        <th
          colSpan={plans.length + 1}
          scope="colgroup"
          className="border-t border-b border-t-mist-950/5 border-b-mist-950/10 pt-14 pb-4 font-semibold text-mist-950 dark:border-t-white/5 dark:border-b-white/10 dark:text-white"
        >
          {group.title}
        </th>
      </tr>
      {group.features.map((feature) => (
        <tr key={String(feature.name)} className="group">
          <th
            scope="row"
            className="border-t border-mist-950/5 py-4 pr-3 font-normal text-mist-700 group-first:border-mist-950/10 dark:border-white/5 dark:text-mist-400 dark:group-first:border-white/10"
          >
            {feature.name}
          </th>
          {plans.map((plan) => {
            const value = isPlanValue(feature.value, plan) ? feature.value[plan] : feature.value

            return (
              <td
                key={plan}
                className="border-t border-mist-950/5 px-3 py-4 text-center text-mist-700 group-first:border-mist-950/10 dark:border-white/10 dark:text-mist-400 dark:group-first:border-white/10"
              >
                {value === true ? (
                  <CheckmarkIcon aria-label={includedLabel} className="stroke-mist-950 dark:stroke-white" />
                ) : value === false ? (
                  <MinusIcon aria-label={notIncludedLabel} className="stroke-mist-950 dark:stroke-white" />
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

export function PlanComparisonTable<const Plan extends string>({
  plans,
  features,
  compareLabel = 'Compare features',
  includedLabel = 'Included',
  notIncludedLabel = 'Not included',
  className,
  ...props
}: {
  plans: Plan[]
  features: {
    title: ReactNode
    features: { name: ReactNode; value: ReactNode | Record<Plan, ReactNode> }[]
  }[]
  compareLabel?: ReactNode
  includedLabel?: string
  notIncludedLabel?: string
} & ComponentProps<'section'>) {
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
              <th className="sticky top-(--scroll-padding-top) bg-mist-100 py-5 pr-3 text-base/7 font-medium text-mist-950 dark:bg-mist-950 dark:text-white">
                {compareLabel}
              </th>
              {plans.map((plan, index) => (
                <th
                  key={index}
                  className="sticky top-(--scroll-padding-top) bg-mist-100 p-3 text-center font-semibold text-mist-950 dark:bg-mist-950 dark:text-white"
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
                  className="relative -mb-px flex-1 border-b border-b-transparent px-2 py-6 text-sm/5 font-medium text-mist-500 aria-selected:border-mist-950 aria-selected:text-mist-950 dark:aria-selected:border-white dark:aria-selected:text-white"
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
