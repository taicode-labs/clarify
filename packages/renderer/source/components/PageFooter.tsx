import clsx from 'clsx'
import { useLocation } from 'react-router-dom'

import { useClarifyConfig } from '../context'
import type { ClarifyConfig, ClarifyLocalizedText, ClarifyNavbarLink } from '../types'

import { BuiltWithClarify } from './BuiltWithClarify'

function resolveLocalizedText(text: ClarifyLocalizedText, locale?: string, fallbackLocale?: string): string {
  if (typeof text === 'string') return text
  return (locale ? text[locale] : undefined) ?? (fallbackLocale ? text[fallbackLocale] : undefined) ?? Object.values(text)[0] ?? ''
}

function isExternalHref(href: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')
}

function localeForPath(config: ClarifyConfig, pathname: string): string | undefined {
  const i18n = config.i18n
  if (!i18n) return undefined
  const firstSegment = pathname.split('/').filter(Boolean)[0]
  return i18n.locales.find((locale) => locale.code === firstSegment)?.code ?? i18n.defaultLocale
}

function localizeHref(href: string, config: ClarifyConfig, locale?: string): string {
  if (!locale || !config.i18n || isExternalHref(href) || href.startsWith('#')) return href
  if (locale === config.i18n.defaultLocale) return href
  const cleanHref = href === '/' ? '' : href.replace(/^\/+/, '')
  return `/${locale}${cleanHref ? `/${cleanHref}` : ''}`
}

function FooterLink(arg0: { link: ClarifyNavbarLink; locale?: string; config: ClarifyConfig }) {
  const { link, locale, config } = arg0
  const external = link.external ?? isExternalHref(link.href)
  const href = external ? link.href : localizeHref(link.href, config, locale)

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="clarify-footer-link text-sm text-zinc-500 no-underline transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
    >
      {resolveLocalizedText(link.label, locale, config.i18n?.defaultLocale)}
    </a>
  )
}

function SocialLink(arg0: { name: string; href: string }) {
  const { name, href } = arg0

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="clarify-footer-social text-sm capitalize text-zinc-500 no-underline transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
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
        'clarify-page-footer mx-auto mt-16 flex w-full max-w-3xl flex-col items-end gap-4 border-t border-zinc-900/10 pt-8 xl:max-w-[56rem] 2xl:max-w-[64rem] dark:border-white/10',
        hasCustomFooter && 'sm:flex-row sm:items-center sm:justify-between',
      )}
    >
      {hasCustomFooter ? (
        <div className="clarify-footer-content flex flex-col gap-3 text-right sm:text-left">
          {copyright ? (
            <p className="clarify-footer-copyright m-0 text-sm text-zinc-500 dark:text-zinc-400">{copyright}</p>
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
