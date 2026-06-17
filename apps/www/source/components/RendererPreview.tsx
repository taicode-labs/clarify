import { useTranslation } from 'react-i18next'

export function RendererPreview() {
  const { t } = useTranslation()

  return (
    <section className="px-6 py-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 rounded-3xl border border-zinc-900/10 bg-zinc-950 p-8 text-white shadow-2xl shadow-zinc-900/20 lg:grid-cols-[0.85fr_1fr] lg:p-12 dark:border-white/10">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">{t('renderer.eyebrow')}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{t('renderer.title')}</h2>
          <p className="mt-4 text-base leading-7 text-zinc-400">
            {t('renderer.description')}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5 sm:col-span-2">
            <p className="text-sm font-medium text-emerald-200">{t('renderer.note')}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{t('renderer.noteDescription')}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="font-mono text-xs text-zinc-500">{t('renderer.navigation')}</p>
            <div className="mt-4 h-2 rounded-full bg-white/10" />
            <div className="mt-3 h-2 w-2/3 rounded-full bg-emerald-400/40" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="font-mono text-xs text-zinc-500">{t('renderer.codeGroup')}</p>
            <div className="mt-4 space-y-2">
              <div className="h-2 rounded-full bg-zinc-700" />
              <div className="h-2 w-4/5 rounded-full bg-zinc-700" />
              <div className="h-2 w-3/5 rounded-full bg-emerald-400/40" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
