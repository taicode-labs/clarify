import clsx from 'clsx'
import { Link, useLocation } from 'react-router-dom'

import { useClarifyConfig } from '../context'
import type { ClarifyConfig, ClarifyLocalizedText, ClarifyNavbarLink } from '../types'
import { isExternalHref, localizeHref } from '../utils/href'

import { BuiltWithClarify } from './BuiltWithClarify'

function resolveLocalizedText(text: ClarifyLocalizedText, locale?: string, fallbackLocale?: string): string {
  if (typeof text === 'string') return text
  return (locale ? text[locale] : undefined) ?? (fallbackLocale ? text[fallbackLocale] : undefined) ?? Object.values(text)[0] ?? ''
}

function localeForPath(config: ClarifyConfig, pathname: string): string | undefined {
  const i18n = config.i18n
  if (!i18n) return undefined
  const firstSegment = pathname.split('/').filter(Boolean)[0]
  return i18n.locales.find((locale) => locale.code === firstSegment)?.code ?? i18n.defaultLocale
}

function FooterLink(arg0: { link: ClarifyNavbarLink; locale?: string; config: ClarifyConfig }) {
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

function SocialLink(arg0: { name: string; href: string }) {
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
  const config = useClarifyConfig()
  const location = useLocation()
  const locale = localeForPath(config, location.pathname)
  const footer = config.footer
  const links = footer?.links ?? []
  const socials = Object.entries(footer?.socials ?? {})
  const copyright = footer?.copyright
    ? resolveLocalizedText(footer.copyright, locale, config.i18n?.defaultLocale)
    : undefined
  const hasCustomFooter = Boolean(copyright || links.length > 0 || socials.length > 0)

  return (
    <footer
      className={clsx(
        'clarify-page-footer mx-auto mt-16 flex w-full max-w-(--clarify-theme-layout-max-width) flex-col items-end gap-4 border-t border-(--clarify-theme-tokens-colors-border) px-4 py-8 sm:px-6 lg:mt-24 lg:px-5 dark:border-white/10',
        hasCustomFooter && 'sm:flex-row sm:items-center sm:justify-between',
      )}
    >
      {hasCustomFooter ? (
        <div className="clarify-footer-content flex flex-col gap-3 text-right sm:text-left">
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
      ) : null}
      <div className="clarify-footer-brand flex justify-end">
        <BuiltWithClarify />
      </div>
    </footer>
  )
}
