import { workflowSteps } from './homeData'

export function Workflow() {
  return (
    <section id="workflow" className="border-y border-zinc-900/10 bg-zinc-50 px-6 py-20 lg:px-8 dark:border-white/10 dark:bg-zinc-900/30">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_31rem] lg:items-center">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">Workflow</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">From content to published docs in minutes.</h2>
          <div className="mt-10 space-y-8">
            {workflowSteps.map(([title, description], index) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-emerald-500 dark:text-zinc-950">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-zinc-900/10 bg-zinc-950 p-2 shadow-xl shadow-zinc-900/10 dark:border-white/10 dark:shadow-black/30">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <span className="font-mono text-xs text-zinc-500">terminal</span>
              <span className="rounded-full bg-emerald-400/10 px-2 py-1 font-mono text-[0.65rem] text-emerald-300">vite ready</span>
            </div>
            <pre className="font-mono text-sm leading-7 text-zinc-300"><code>{`pnpm add @clarify/cli
clarify dev

  Local:   http://localhost:5173
  Build:   clarify build
  Output:  ./output`}</code></pre>
          </div>
        </div>
      </div>
    </section>
  )
}
