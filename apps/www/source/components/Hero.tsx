import { Button } from './Button'
import { capabilityTags, previewNavItems } from './homeData'
import { ArrowIcon } from './icons'
import { docsLinks } from './links'

function HeroPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute left-1/2 top-0 h-112 w-7xl -translate-x-1/2 bg-linear-to-r from-emerald-300/25 via-lime-200/20 to-sky-300/20 blur-3xl dark:from-emerald-500/15 dark:via-lime-300/10 dark:to-sky-400/10" />
      <svg className="absolute left-1/2 top-0 h-144 w-7xl -translate-x-1/2 stroke-zinc-900/10 mask-[radial-gradient(closest-side,white,transparent)] dark:stroke-white/10" aria-hidden="true">
        <defs>
          <pattern id="hero-grid" width="72" height="56" patternUnits="userSpaceOnUse" x="50%" y="0">
            <path d="M.5 56V.5H72" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" strokeWidth="0" />
      </svg>
    </div>
  )
}

function ProductPreview() {
  return (
    <div className="rounded-3xl border border-zinc-900/10 bg-white/80 p-2 shadow-2xl shadow-zinc-900/10 backdrop-blur dark:border-white/10 dark:bg-zinc-900/80 dark:shadow-black/30">
      <div className="rounded-2xl border border-zinc-900/10 bg-zinc-950 text-zinc-100 dark:border-white/10">
        <div className="flex h-10 items-center gap-2 border-b border-white/10 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 rounded-md bg-white/5 px-2 py-1 font-mono text-[0.65rem] text-zinc-400">docs/index.mdx</span>
        </div>
        <div className="grid gap-0 lg:grid-cols-[11rem_1fr]">
          <aside className="hidden border-r border-white/10 p-4 lg:block">
            {previewNavItems.map((item, index) => (
              <div key={item} className={`mb-2 rounded-lg px-3 py-2 text-xs ${index === 0 ? 'bg-emerald-400/10 text-emerald-300' : 'text-zinc-500'}`}>
                {item}
              </div>
            ))}
          </aside>
          <div className="p-5 sm:p-6">
            <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-md bg-emerald-400/10 px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold text-emerald-300">GET</span>
                <span className="font-mono text-xs text-zinc-300">/v1/projects</span>
              </div>
              <p className="text-sm leading-6 text-zinc-400">Fetch projects and render the reference page from your OpenAPI schema.</p>
            </div>
            <pre className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-4 text-left font-mono text-xs leading-6 text-zinc-300"><code>{`# Build docs with Clarify

:::note
MDX, React, and OpenAPI share one docs runtime.
:::

<Endpoint method="GET" path="/v1/projects" />`}</code></pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-20 sm:py-28 lg:px-8" id="docs">
      <HeroPattern />
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_34rem]">
        <div>
          <p className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
            Open-source docs publishing for modern teams
          </p>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl dark:text-white">
            Publish MDX and OpenAPI docs with one composable system.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Clarify combines Markdown, React components, API references, and Vite-powered builds into a documentation workflow that stays fast, typed, and easy to customize.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href={docsLinks.gettingStarted}>Get started</Button>
            <Button href={docsLinks.reference} variant="secondary">Explore docs</Button>
            <Button href={docsLinks.github} variant="text">View GitHub <ArrowIcon /></Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-2">
            {capabilityTags.map((tag) => (
              <span key={tag} className="rounded-full border border-zinc-900/10 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <ProductPreview />
      </div>
    </section>
  )
}
