import { Moon, Sun } from 'lucide-react'
import { type ReactElement, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { navLinks, site } from './content'
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

const themeStorageKey = 'clarify:theme'

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
    const storedLocale = localStorage.getItem('clarify-locale')
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
  const nextTheme: ResolvedTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
  const label = nextTheme === 'dark' ? t('common.theme.switchToDark') : t('common.theme.switchToLight')

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
      <Sun className="size-5 stroke-(--clarify-ui-text-strong) dark:hidden" aria-hidden="true" />
      <Moon className="hidden size-5 stroke-(--clarify-ui-text-strong) dark:block" aria-hidden="true" />
    </button>
  )
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
        localStorage.setItem('clarify-locale', nextLocale)
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

  try {
    const storedTheme = window.localStorage.getItem(themeStorageKey)
    return storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system' ? storedTheme : 'system'
  } catch {
    return 'system'
  }
}

function storeTheme(theme: ThemePreference) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(themeStorageKey, theme)
  } catch {
    // Ignore storage failures from private mode or restricted embeds.
  }
}

function applyTheme(resolvedTheme: ResolvedTheme) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  document.documentElement.style.colorScheme = resolvedTheme
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
        <NewsletterForm
          headline={t('footer.newsletterHeadline')}
          subheadline={<p>{t('footer.newsletterSubheadline')}</p>}
          emailLabel={t('common.email')}
          subscribeLabel={t('common.subscribe')}
          action={site.contactUrl}
        />
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
