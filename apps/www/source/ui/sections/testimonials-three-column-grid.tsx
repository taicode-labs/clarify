import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'
import { Section } from '../elements/section'

export function Testimonial({
  quote,
  img,
  name,
  byline,
  className,
  ...props
}: {
  quote: ReactNode
  img: ReactNode
  name: ReactNode
  byline: ReactNode
} & ComponentProps<'figure'>) {
  return (
    <figure
      className={clsx(
        'flex flex-col justify-between gap-10 rounded-md bg-mist-950/2.5 p-6 text-sm/7 text-mist-950 dark:bg-white/5 dark:text-white',
        className,
      )}
      {...props}
    >
      <blockquote className="relative flex flex-col gap-4 *:first:before:absolute *:first:before:inline *:first:before:-translate-x-full *:first:before:content-['“'] *:last:after:inline *:last:after:content-['”']">
        {quote}
      </blockquote>
      <figcaption className="flex items-center gap-4">
        <div className="flex size-12 overflow-hidden rounded-full outline -outline-offset-1 outline-black/5 *:size-full *:object-cover dark:outline-white/5">
          {img}
        </div>
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-mist-700 dark:text-mist-400">{byline}</p>
        </div>
      </figcaption>
    </figure>
  )
}

export function TestimonialThreeColumnGrid({ children, ...props }: ComponentProps<typeof Section>) {
  return (
    <Section {...props}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </Section>
  )
}
