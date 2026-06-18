import { useTranslation } from 'react-i18next'

import { Button } from './Button'
import { LanguageSelect } from './LanguageSelect'
import { docsLinks, primaryNavLinks } from './links'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-900/10 bg-white/85 backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <a href={docsLinks.home} className="flex items-center gap-3 no-underline">
          <img src="/clarify.svg" alt="" className="h-5 w-auto" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">{t('app.title')}</span>
        </a>
        <nav className="hidden items-center gap-8 md:flex" aria-label={t('nav.ariaLabel')}>
          {primaryNavLinks.map((link) => (
            <a key={link.labelKey} href={link.href} className="text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
              {t(link.labelKey)}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a href={docsLinks.github} className="hidden text-sm text-zinc-600 transition hover:text-zinc-900 sm:block dark:text-zinc-400 dark:hover:text-white">
            {t('nav.github')}
          </a>
          <LanguageSelect />
          <ThemeToggle />
          <Button href={docsLinks.gettingStarted} variant="secondary">{t('nav.getStarted')}</Button>
        </div>
      </div>
    </header>
  )
}
