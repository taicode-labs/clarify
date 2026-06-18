import { useTranslation } from 'react-i18next'

import { docsLinks } from './links'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-zinc-900/10 px-6 py-10 dark:border-white/10 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <img src="/clarify.svg" alt="" className="h-8 w-11" />
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{t('app.title')}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">{t('footer.license')}</p>
          </div>
        </div>
        <div className="flex gap-6 text-sm text-zinc-500 dark:text-zinc-400">
          <a href={docsLinks.gettingStarted} className="transition hover:text-zinc-900 dark:hover:text-white">{t('footer.docs')}</a>
          <a href={docsLinks.openapi} className="transition hover:text-zinc-900 dark:hover:text-white">{t('footer.api')}</a>
          <a href={docsLinks.github} className="transition hover:text-zinc-900 dark:hover:text-white">{t('footer.github')}</a>
        </div>
      </div>
    </footer>
  )
}
