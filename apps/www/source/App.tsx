import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { ApiPreview } from './components/ApiPreview'
import { Features } from './components/Features'
import { FinalCta } from './components/FinalCta'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { RendererPreview } from './components/RendererPreview'
import { Workflow } from './components/Workflow'
import { normalizeLanguage } from './i18n'

export default function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)
    document.documentElement.lang = language
    document.documentElement.dir = i18n.dir(language)
  }, [i18n, i18n.language, i18n.resolvedLanguage])

  return (
    <main className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
      <Header />
      <Hero />
      <Features />
      <Workflow />
      <ApiPreview />
      <RendererPreview />
      <FinalCta />
      <Footer />
    </main>
  )
}
