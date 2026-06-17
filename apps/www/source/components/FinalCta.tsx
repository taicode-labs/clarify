import { Button } from './Button'
import { docsLinks } from './links'

export function FinalCta() {
  return (
    <section className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-3xl border border-emerald-500/20 bg-emerald-50 px-6 py-14 text-center shadow-sm shadow-emerald-500/10 dark:bg-emerald-400/10">
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">Start publishing clearer documentation.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Build a docs site that grows from README to API reference without changing your stack.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href={docsLinks.gettingStarted}>Get started</Button>
          <Button href={docsLinks.github} variant="secondary">GitHub</Button>
        </div>
      </div>
    </section>
  )
}
