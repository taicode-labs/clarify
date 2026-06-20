import type { ComponentProps } from 'react'

export default function Link({ href, ...props }: { href: string } & Omit<ComponentProps<'a'>, 'href'>) {
  return <a href={href} {...props} />
}
