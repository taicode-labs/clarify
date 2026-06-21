import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'

import { Container } from './container'
import { Eyebrow } from './eyebrow'
import { Subheading } from './subheading'
import { Text } from './text'

export function Section(arg0: {
  eyebrow?: ReactNode
  headline?: ReactNode
  subheadline?: ReactNode
  cta?: ReactNode
} & ComponentProps<'section'>) {  const {
  eyebrow,
  headline,
  subheadline,
  cta,
  className,
  children,
  ...props
} = arg0

  return (
    <section className={clsx('py-16', className)} {...props}>
      <Container className="flex flex-col gap-10 sm:gap-16">
        {headline && (
          <div className="flex max-w-2xl flex-col gap-6">
            <div className="flex flex-col gap-2">
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              <Subheading>{headline}</Subheading>
            </div>
            {subheadline && <Text className="text-pretty">{subheadline}</Text>}
            {cta && <div className="self-start">{cta}</div>}
          </div>
        )}
        <div>{children}</div>
      </Container>
    </section>
  )
}
