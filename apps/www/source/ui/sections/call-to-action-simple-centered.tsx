import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'

import { Container } from '../elements/container'
import { Subheading } from '../elements/subheading'
import { Text } from '../elements/text'

type CallToActionSimpleCenteredProps = {
  headline: ReactNode
  subheadline?: ReactNode
  cta?: ReactNode
} & ComponentProps<'section'>

export function CallToActionSimpleCentered(arg0: CallToActionSimpleCenteredProps) {  const {
  headline,
  subheadline,
  cta,
  className,
  ...props
} = arg0

  return (
    <section className={clsx('py-16', className)} {...props}>
      <Container className="flex flex-col items-start gap-10">
        <div className="flex flex-col gap-6">
          <Subheading className="max-w-4xl text-left">{headline}</Subheading>
          {subheadline && <Text className="flex max-w-3xl flex-col gap-4 text-left text-pretty">{subheadline}</Text>}
        </div>
        {cta}
      </Container>
    </section>
  )
}
