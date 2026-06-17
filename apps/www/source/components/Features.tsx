import { FeatureIcon } from './icons'
import { features } from './homeData'
import { SectionHeading } from './SectionHeading'

export function Features() {
  return (
    <section id="features" className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Features"
          title="Everything needed for developer documentation."
          description="Clarify keeps content authoring, API references, visual primitives, and production builds in one focused toolchain."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-zinc-900/10 bg-white p-6 shadow-sm shadow-zinc-900/5 transition hover:border-emerald-500/30 dark:border-white/10 dark:bg-zinc-900/50 dark:shadow-black/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-500/20 dark:bg-emerald-400/10">
                <FeatureIcon path={feature.icon} />
              </div>
              <h3 className="mt-5 text-base font-semibold text-zinc-900 dark:text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
