import type { ComponentProps } from 'react'

export default function Link(arg0: { href: string } & Omit<ComponentProps<'a'>, 'href'>) {  const { href, ...props } = arg0

  return <a href={href} {...props} />
}
