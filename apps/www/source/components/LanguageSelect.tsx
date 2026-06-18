import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { useTranslation } from 'react-i18next'

import { languageLabels, normalizeLanguage, supportedLanguages, type SupportedLanguage } from '../i18n'

export function LanguageSelect() {
  const { i18n, t } = useTranslation()
  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)

  return (
    <Listbox value={language} onChange={(value) => void i18n.changeLanguage(value)}>
      <div className="relative">
        <ListboxButton
          aria-label={t('language.label')}
          className="group inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none data-focus:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-white dark:data-focus:bg-zinc-800/70"
        >
          <span>{languageLabels[language]}</span>
          <svg className="h-4 w-4 text-zinc-500 transition group-data-open:rotate-180 dark:text-zinc-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </ListboxButton>
        <ListboxOptions className="absolute right-0 z-50 mt-2 w-36 origin-top-right overflow-hidden rounded-2xl bg-white p-1 shadow-xl shadow-zinc-900/10 ring-1 ring-zinc-900/10 transition [--anchor-gap:--spacing(2)] focus:outline-none data-closed:scale-95 data-closed:opacity-0 dark:bg-zinc-900 dark:shadow-black/30 dark:ring-white/10">
          {supportedLanguages.map((item: SupportedLanguage) => (
            <ListboxOption
              key={item}
              value={item}
              className="group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-zinc-700 select-none data-focus:bg-emerald-50 data-focus:text-zinc-900 dark:text-zinc-300 dark:data-focus:bg-emerald-400/10 dark:data-focus:text-white"
            >
              <span>{languageLabels[item]}</span>
              <svg className="hidden h-4 w-4 text-emerald-500 group-data-selected:block" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-7.5 9.5a.75.75 0 0 1-1.127.075l-4-4a.75.75 0 0 1 1.06-1.06l3.404 3.403 6.968-8.827a.75.75 0 0 1 1.052-.143Z" clipRule="evenodd" />
              </svg>
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  )
}
