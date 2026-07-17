import type { ComponentProps } from 'react'
import { Link as ReactRouterLink } from 'react-router-dom'

type LinkProps = {
  href: string
} & Omit<ComponentProps<'a'>, 'href'>

export default function Link(arg0: LinkProps) {
  const { href, ...props } = arg0

  if (/^(?:[a-z]+:|#)/i.test(href)) {
    return <a href={href} {...props} />
  }

  return <ReactRouterLink to={href} {...props} />
}
