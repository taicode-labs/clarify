import clsx from 'clsx'
import { Link, useLocation } from 'react-router-dom'

import { useConfig } from '../core/context'
import type { Config, NavbarLink } from '../core/types'
import { isExternalHref, localizeHref } from '../utils/href'
import { resolveLocalizedText } from '../utils/localized-text'

function localeForPath(config: Config, pathname: string): string | undefined {
  const i18n = config.i18n
  if (!i18n) return undefined
  const firstSegment = pathname.split('/').filter(Boolean)[0]
  return i18n.locales.find((locale) => locale.code === firstSegment)?.code ?? i18n.defaultLocale
}

type FooterLinkProps = { link: NavbarLink; locale?: string; config: Config }

function FooterLink(arg0: FooterLinkProps) {
  const { link, locale, config } = arg0
  const external = link.external ?? isExternalHref(link.href)
  const href = external ? link.href : localizeHref(link.href, config, locale)
  const className = "clarify-footer-link no-underline transition"
  const label = resolveLocalizedText(link.label, locale, config.i18n?.defaultLocale)

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {label}
      </a>
    )
  }

  return (
    <Link to={href} className={className}>
      {label}
    </Link>
  )
}

type SocialLinkProps = { name: string; href: string }

function SocialLink(arg0: SocialLinkProps) {
  const { name, href } = arg0

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="clarify-footer-social capitalize no-underline transition"
    >
      {name}
    </a>
  )
}

export function PageFooter() {
  const config = useConfig()
  const location = useLocation()
  const locale = localeForPath(config, location.pathname)
  const footer = config.footer
  if (!footer) return null

  const links = footer.links ?? []
  const socials = Object.entries(footer.socials ?? {})
  const copyright = footer.copyright
    ? resolveLocalizedText(footer.copyright, locale, config.i18n?.defaultLocale)
    : undefined
  const hasContent = Boolean(copyright || links.length > 0 || socials.length > 0)

  if (!hasContent) return null

  return (
    <footer className="clarify-page-footer mt-16 flex w-full flex-col gap-4 border-t border-(--clarify-theme-tokens-colors-border) py-8 lg:mt-24">
      <div
        className={clsx(
          'clarify-footer-content flex flex-col items-end gap-3 text-right',
          'sm:items-start sm:text-left',
        )}
      >
        {copyright ? (
          <p className="clarify-footer-copyright m-0">{copyright}</p>
        ) : null}
        {links.length > 0 || socials.length > 0 ? (
          <div className="clarify-footer-links flex flex-wrap justify-end gap-x-4 gap-y-2 sm:justify-start">
            {links.map((link) => (
              <FooterLink key={`${link.href}-${resolveLocalizedText(link.label, locale, config.i18n?.defaultLocale)}`} link={link} locale={locale} config={config} />
            ))}
            {socials.map(([name, href]) => (
              <SocialLink key={name} name={name} href={href} />
            ))}
          </div>
        ) : null}
      </div>
    </footer>
  )
}
