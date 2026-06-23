import type { ComponentPropsWithoutRef } from 'react'
import { Link } from 'react-router-dom'

import { useClarifyConfig, useClarifyLocale } from '../context'
import { isExternalHref, localizeHref } from '../utils/href'

export function useLocalizedHref(href: string): string {
  const config = useClarifyConfig()
  const locale = useClarifyLocale()
  return localizeHref(href, config, locale)
}

export type LocalizedLinkProps = ComponentPropsWithoutRef<'a'> & {
  href: string
}

export function LocalizedLink(arg0: LocalizedLinkProps) {
  const { href, ...props } = arg0
  const localizedHref = useLocalizedHref(href)

  if (!isExternalHref(localizedHref) && !localizedHref.startsWith('#')) {
    return <Link to={localizedHref} {...props} />
  }

  return <a href={localizedHref} {...props} />
}
