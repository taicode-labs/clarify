import { ApiPreview } from './components/ApiPreview'
import { Features } from './components/Features'
import { FinalCta } from './components/FinalCta'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { RendererPreview } from './components/RendererPreview'
import { Workflow } from './components/Workflow'

export default function App() {
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
