import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'

import english from '../../public/locales/en/translation.json'
import { localeCookieName } from '../utils/cookies'

import { locales } from './locales'

const isBrowser = typeof window !== 'undefined'

i18n.use(initReactI18next)

if (isBrowser) {
  i18n.use(HttpBackend).use(LanguageDetector)
}

await i18n.init({
  lng: 'en',
  supportedLngs: locales,
  fallbackLng: 'en',
  load: 'currentOnly',
  resources: isBrowser ? undefined : { en: { translation: english } },
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
  detection: {
    order: ['cookie', 'navigator'],
    lookupCookie: localeCookieName,
    caches: ['cookie'],
    cookieOptions: {
      path: '/',
      sameSite: 'lax',
    },
  },
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: true,
  },
})

export default i18n
export { type AppLocale, isAppLocale, localeLabels, locales } from './locales'
