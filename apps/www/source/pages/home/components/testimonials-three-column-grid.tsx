import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'

import { Section } from '../../../components/elements/section'

type TestimonialProps = {
  quote: ReactNode
  img: ReactNode
  name: ReactNode
  byline: ReactNode
} & ComponentProps<'figure'>

type TestimonialThreeColumnGridProps = ComponentProps<typeof Section>

export function Testimonial(arg0: TestimonialProps) {  const {
  quote,
  img,
  name,
  byline,
  className,
  ...props
} = arg0

  return (
    <figure
      className={clsx(
        'flex flex-col justify-between gap-10 rounded-md bg-(--clarify-ui-subtle-background) p-6 text-sm/7 text-(--clarify-ui-text-strong)',
        className,
      )}
      {...props}
    >
      <blockquote className="relative flex flex-col gap-4 *:first:before:absolute *:first:before:inline *:first:before:-translate-x-full *:first:before:content-['“'] *:last:after:inline *:last:after:content-['”']">
        {quote}
      </blockquote>
      <figcaption className="flex items-center gap-4">
        <div className="flex size-12 overflow-hidden rounded-full outline -outline-offset-1 outline-(--clarify-theme-tokens-colors-border) *:size-full *:object-cover">
          {img}
        </div>
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-(--clarify-ui-text-soft)">{byline}</p>
        </div>
      </figcaption>
    </figure>
  )
}

export function TestimonialThreeColumnGrid(arg0: TestimonialThreeColumnGridProps) {  const { children, ...props } = arg0

  return (
    <Section {...props}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </Section>
  )
}
