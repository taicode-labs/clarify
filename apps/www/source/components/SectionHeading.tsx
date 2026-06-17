export function SectionHeading(arg0: { eyebrow: string; title: string; description: string }) {
  const { eyebrow, title, description } = arg0

  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">{title}</h2>
      <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  )
}
