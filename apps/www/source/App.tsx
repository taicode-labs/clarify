import { Monitor, Moon, Sun } from 'lucide-react'
import { type ReactElement, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { navLinks, site } from './content'
import { cookieMaxAge, localeCookieName, readCookieValue, storeSharedCookie, themeCookieName } from './cookies'
import { type AppLocale, isAppLocale, localeLabels, locales } from './i18n'
import { AboutPage, HomePage, NotFoundPage, PricingPage, PrivacyPolicyPage } from './pages'
import { resolveAppRoute, type AppRoute } from './ssg-routes'
import { ButtonLink, PlainButtonLink } from './ui/elements/button'
import { Main } from './ui/elements/main'
import { GitHubIcon } from './ui/icons/social/github-icon'
import { XIcon } from './ui/icons/social/x-icon'
import { ClarifyLogo } from './ui/Logo'
import {
  FooterCategory,
  FooterLink,
  FooterWithNewsletterFormCategoriesAndSocialIcons,
  NewsletterForm,
  SocialLink,
} from './ui/sections/footer-with-newsletter-form-categories-and-social-icons'
import {
  NavbarLink,
  NavbarLogo,
  NavbarWithLinksActionsAndCenteredLogo,
} from './ui/sections/navbar-with-links-actions-and-centered-logo'

type ThemePreference = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

type AppProps = { path?: string }

export default function App(props: AppProps) {
  const normalizedPath = resolveAppRoute(props.path)

  return (
    <div className="www-app clarify-app min-h-screen">
      <AppEffects />
      <Navbar />
      <Main>{renderRoute(normalizedPath)}</Main>
      <Footer />
    </div>
  )
}

function AppEffects() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const storedLocale = readCookieValue(localeCookieName)
    const browserLocale = navigator.language === 'zh-CN' || navigator.language.startsWith('zh') ? 'zh-CN' : 'en'
    const locale = storedLocale && isAppLocale(storedLocale) ? storedLocale : browserLocale

    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale)
    }
  }, [i18n])

  useEffect(() => {
    document.documentElement.lang = i18n.language === 'zh-CN' ? 'zh-CN' : 'en'
  }, [i18n.language])

  return null
}

const routeComponents: Record<AppRoute, () => ReactElement> = {
  '/': HomePage,
  '/pricing/': PricingPage,
  '/about/': AboutPage,
  '/privacy-policy/': PrivacyPolicyPage,
  '/404.html': NotFoundPage,
}

function renderRoute(path: AppRoute) {
  return routeComponents[path]()
}

function Navbar() {
  const { i18n, t } = useTranslation()

  return (
    <NavbarWithLinksActionsAndCenteredLogo
      id="navbar"
      links={
        <>
          {navLinks.map((link) => (
            <NavbarLink key={link.href} href={link.href}>
              {link.label}
            </NavbarLink>
          ))}
        </>
      }
      logo={
        <NavbarLogo href="/">
          <ClarifyLogo />
        </NavbarLogo>
      }
      controls={
        <>
          <ThemeToggle />
          <LanguageToggle currentLocale={toAppLocale(i18n.language)} />
        </>
      }
      actions={
        <>
          <PlainButtonLink href={site.githubUrl} className="max-lg:w-full">{t('common.github')}</PlainButtonLink>
          <ButtonLink href={site.docsUrl} className="max-lg:w-full">{t('common.getStarted')}</ButtonLink>
        </>
      }
    />
  )
}

function ThemeToggle() {
  const { t } = useTranslation()
  const [theme, setThemeState] = useState<ThemePreference>(() => getStoredTheme())
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme())
  const resolvedTheme = theme === 'system' ? systemTheme : theme
  const nextTheme = getNextTheme(theme)
  const label = getThemeLabel(nextTheme, t)

  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    function updateSystemTheme() {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    }

    updateSystemTheme()
    mediaQuery.addEventListener('change', updateSystemTheme)

    return () => mediaQuery.removeEventListener('change', updateSystemTheme)
  }, [])

  function setTheme(nextTheme: ThemePreference) {
    setThemeState(nextTheme)
    storeTheme(nextTheme)
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setTheme(nextTheme)}
      className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-full text-(--clarify-ui-text-strong) transition hover:bg-(--clarify-ui-hover-background)"
    >
      <span className="absolute size-12 pointer-fine:hidden" />
      {theme === 'system' ? <Monitor className="size-5 stroke-(--clarify-ui-text-strong)" aria-hidden="true" /> : null}
      {theme === 'light' ? <Sun className="size-5 stroke-(--clarify-ui-text-strong)" aria-hidden="true" /> : null}
      {theme === 'dark' ? <Moon className="size-5 stroke-(--clarify-ui-text-strong)" aria-hidden="true" /> : null}
    </button>
  )
}

function getNextTheme(theme: ThemePreference): ThemePreference {
  if (theme === 'system') return 'light'
  if (theme === 'light') return 'dark'
  return 'system'
}

function getThemeLabel(theme: ThemePreference, t: ReturnType<typeof useTranslation>['t']) {
  if (theme === 'dark') return t('common.theme.switchToDark')
  if (theme === 'light') return t('common.theme.switchToLight')
  return t('common.theme.switchToSystem')
}

type LanguageToggleProps = { currentLocale: AppLocale }

function LanguageToggle(props: LanguageToggleProps) {
  const { i18n, t } = useTranslation()
  const currentLocale = props.currentLocale
  const nextLocale = currentLocale === 'en' ? 'zh-CN' : 'en'

  return (
    <button
      type="button"
      aria-label={t('common.language.switchTo', { language: localeLabels[nextLocale] })}
      onClick={() => {
        storeSharedCookie(localeCookieName, nextLocale)
        void i18n.changeLanguage(nextLocale)
      }}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm/7 font-medium text-(--clarify-ui-text-strong) transition hover:bg-(--clarify-ui-hover-background)"
    >
      {currentLocale === 'en' ? '简' : 'EN'}
    </button>
  )
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system'
  }

  return readThemeCookie() ?? 'system'
}

function storeTheme(theme: ThemePreference) {
  storeSharedCookie(themeCookieName, theme, cookieMaxAge)
}

function applyTheme(resolvedTheme: ResolvedTheme) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  document.documentElement.style.colorScheme = resolvedTheme
}

function readThemeCookie(): ThemePreference | null {
  const value = readCookieValue(themeCookieName)
  return isThemePreference(value) ? value : null
}

function isThemePreference(value: string | null | undefined): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

function toAppLocale(locale: string): AppLocale {
  return isAppLocale(locale) ? locale : locales.find((item) => locale.startsWith(item)) ?? 'en'
}

function Footer() {
  const { t } = useTranslation()

  return (
    <FooterWithNewsletterFormCategoriesAndSocialIcons
      id="footer"
      cta={
        <div className="flex flex-col gap-8">
          <NewsletterForm
            headline={t('footer.newsletterHeadline')}
            subheadline={<p>{t('footer.newsletterSubheadline')}</p>}
            emailLabel={t('common.email')}
            subscribeLabel={t('common.subscribe')}
            action={site.contactUrl}
          />
          <a
            href="https://www.producthunt.com/products/clarify-9?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-clarify-10"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-fit"
          >
            <img
              alt="Clarify - Open-source docs publishing for MDX and OpenAPI | Product Hunt"
              width={250}
              height={54}
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1178797&theme=neutral&t=1782318977325"
            />
          </a>
        </div>
      }
      links={
        <>
          <FooterCategory title={t('footer.product')}>
            <FooterLink href="/#features">{t('nav.features')}</FooterLink>
            <FooterLink href="/pricing/">{t('nav.pricing')}</FooterLink>
            <FooterLink href={site.docsUrl}>{t('footer.documentation')}</FooterLink>
          </FooterCategory>
          <FooterCategory title={t('footer.company')}>
            <FooterLink href="/about/">{t('nav.about')}</FooterLink>
            <FooterLink href={site.contactUrl}>{t('footer.contact')}</FooterLink>
            <FooterLink href={site.githubUrl}>{t('common.github')}</FooterLink>
          </FooterCategory>
          <FooterCategory title={t('footer.resources')}>
            <FooterLink href={`${site.docsUrl}/getting-started`}>{t('footer.gettingStarted')}</FooterLink>
            <FooterLink href={`${site.docsUrl}/guides`}>{t('footer.guides')}</FooterLink>
            <FooterLink href={`${site.docsUrl}/api`}>{t('footer.apiReference')}</FooterLink>
          </FooterCategory>
          <FooterCategory title={t('footer.legal')}>
            <FooterLink href="/privacy-policy/">{t('footer.privacyPolicy')}</FooterLink>
            <FooterLink href="/pricing/">{t('footer.commercialServices')}</FooterLink>
          </FooterCategory>
        </>
      }
      fineprint={t('footer.fineprint')}
      socialLinks={
        <>
          <SocialLink href="https://x.com/yxulai" name="X">
            <XIcon />
          </SocialLink>
          <SocialLink href={site.githubUrl} name="GitHub">
            <GitHubIcon />
          </SocialLink>
        </>
      }
    />
  )
}
