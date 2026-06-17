import { useTranslation } from 'react-i18next'

import { languageLabels, normalizeLanguage, supportedLanguages, type SupportedLanguage } from '../i18n'

export function LanguageSelect() {
  const { i18n, t } = useTranslation()
  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)

  return (
    <label className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
      <span className="sr-only">{t('language.label')}</span>
      <select
        aria-label={t('language.label')}
        className="rounded-full bg-zinc-100 px-3 py-2 text-sm text-zinc-700 ring-1 ring-inset ring-zinc-900/10 transition hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-800/50 dark:text-zinc-300 dark:ring-white/10 dark:hover:bg-zinc-800 dark:hover:text-white"
        value={language}
        onChange={(event) => void i18n.changeLanguage(event.target.value as SupportedLanguage)}
      >
        {supportedLanguages.map((item) => (
          <option key={item} value={item}>{languageLabels[item]}</option>
        ))}
      </select>
    </label>
  )
}
