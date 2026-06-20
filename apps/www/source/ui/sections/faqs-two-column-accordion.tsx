import { clsx } from 'clsx/lite'
import { type ComponentProps, type ReactNode, useId } from 'react'

import { Container } from '../elements/container'
import { Subheading } from '../elements/subheading'
import { Text } from '../elements/text'
import { MinusIcon } from '../icons/minus-icon'
import { PlusIcon } from '../icons/plus-icon'
import { Disclosure } from '../primitives/interactive'

export function Faq(arg0: { question: ReactNode; answer: ReactNode } & ComponentProps<'div'>) {
  const { id: providedId, question, answer, ...props } = arg0
  const autoId = useId()
  const id = providedId || autoId

  return (
    <div id={id} {...props}>
      <button
        type="button"
        id={`${id}-question`}
        data-command="--toggle"
        data-commandfor={`${id}-answer`}
        className="flex w-full items-start justify-between gap-6 py-4 text-left text-base/7 text-(--clarify-ui-text-strong)"
      >
        {question}
        <PlusIcon className="h-lh in-aria-expanded:hidden" />
        <MinusIcon className="h-lh not-in-aria-expanded:hidden" />
      </button>
      <Disclosure
        id={`${id}-answer`}
        hidden
        className="-mt-2 flex flex-col gap-2 pr-12 pb-4 text-sm/7 text-(--clarify-ui-text-soft)"
      >
        {answer}
      </Disclosure>
    </div>
  )
}

export function FAQsTwoColumnAccordion(arg0: {
  headline?: ReactNode
  subheadline?: ReactNode
} & ComponentProps<'section'>) {
  const { headline, subheadline, className, children, ...props } = arg0

  return (
    <section className={clsx('py-16', className)} {...props}>
      <Container className="grid grid-cols-1 gap-x-2 gap-y-8 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Subheading>{headline}</Subheading>
          {subheadline && <Text className="flex flex-col gap-4 text-pretty">{subheadline}</Text>}
        </div>
        <div className="divide-y divide-(--clarify-theme-tokens-colors-border) border-y border-(--clarify-theme-tokens-colors-border)">
          {children}
        </div>
      </Container>
    </section>
  )
}
