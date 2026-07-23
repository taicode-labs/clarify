import { Link } from 'react-router-dom'

import { useConfig, useLocale } from '../core/context'
import { useBuiltInText } from '../core/i18n'
import { resolveHomeHref } from '../utils/href'

export function BuiltInNotFoundPage() {
  const text = useBuiltInText()
  const config = useConfig()
  const locale = useLocale()
  const homeHref = resolveHomeHref(config, locale)

  return (
    <section className="mx-auto flex min-h-(--clarify-error-page-min-height) max-w-2xl flex-col justify-center py-16 text-(--clarify-theme-tokens-colors-foreground)" aria-labelledby="clarify-not-found-title">
      <p className="text-sm/6 font-semibold text-(--clarify-theme-tokens-colors-primary)">{text('notFound.label')}</p>
      <h1 id="clarify-not-found-title" className="mt-3 text-3xl/9 font-semibold tracking-tight text-(--clarify-theme-tokens-colors-foreground)">{text('notFound.title')}</h1>
      <p className="mt-4 text-sm/6 text-(--clarify-theme-tokens-colors-muted)">{text('notFound.description')}</p>
      <div className="mt-8">
        <Link className="inline-flex items-center rounded-(--clarify-theme-tokens-radius-md) bg-(--clarify-theme-tokens-colors-primary) px-3 py-2 text-sm/5 font-semibold text-white shadow-xs transition hover:opacity-90" to={homeHref}>
          {text('notFound.home')}
        </Link>
      </div>
    </section>
  )
}
