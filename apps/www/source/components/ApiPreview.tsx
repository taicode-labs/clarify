import { Button } from './Button'
import { ArrowIcon } from './icons'
import { docsLinks } from './links'

export function ApiPreview() {
  return (
    <section id="openapi" className="px-6 py-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1fr] lg:items-center">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">OpenAPI</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">API references without the manual maintenance.</h2>
          <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Import an OpenAPI document and let Clarify turn endpoints, parameters, responses, and examples into readable reference pages that match the rest of your docs.
          </p>
          <div className="mt-8 flex gap-3">
            <Button href={docsLinks.openapi} variant="secondary">See API docs</Button>
            <Button href={docsLinks.guides} variant="text">Read guides <ArrowIcon /></Button>
          </div>
        </div>
        <div className="rounded-3xl border border-zinc-900/10 bg-white p-6 shadow-xl shadow-zinc-900/10 dark:border-white/10 dark:bg-zinc-900/50 dark:shadow-black/20">
          <div className="flex flex-wrap items-center gap-3 border-b border-zinc-900/10 pb-5 dark:border-white/10">
            <span className="rounded-lg bg-emerald-400/10 px-2 py-1 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">GET</span>
            <code className="text-sm text-zinc-900 dark:text-white">/api/projects</code>
            <span className="ml-auto rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-500 dark:bg-white/5 dark:text-zinc-400">200 OK</span>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Parameters</h3>
              <dl className="mt-4 space-y-3 text-sm">
                {['organization', 'limit', 'cursor'].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 dark:bg-white/5">
                    <dt className="font-mono text-xs text-zinc-700 dark:text-zinc-300">{item}</dt>
                    <dd className="font-mono text-[0.65rem] text-zinc-400">string</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Response</h3>
              <pre className="mt-4 overflow-hidden rounded-xl bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-300"><code>{`{
  "data": [
    { "name": "docs" }
  ]
}`}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
