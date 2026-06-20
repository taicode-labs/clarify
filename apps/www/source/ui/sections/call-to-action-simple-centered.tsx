import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'
import { Container } from '../elements/container'
import { Subheading } from '../elements/subheading'
import { Text } from '../elements/text'

export function CallToActionSimpleCentered({
  headline,
  subheadline,
  cta,
  className,
  ...props
}: {
  headline: ReactNode
  subheadline?: ReactNode
  cta?: ReactNode
} & ComponentProps<'section'>) {
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
