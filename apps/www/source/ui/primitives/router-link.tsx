import type { ComponentProps } from 'react'

type LinkProps = {
  href: string
} & Omit<ComponentProps<'a'>, 'href'>

export default function Link(arg0: LinkProps) {
  const { href, ...props } = arg0

  return <a href={href} {...props} />
}
