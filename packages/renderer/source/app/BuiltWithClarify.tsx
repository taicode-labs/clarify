import clarifyMarkUrl from '../assets/clarify.svg?url'
import { useBuiltInText } from '../core/i18n'

export function BuiltWithClarify() {
  const t = useBuiltInText()

  return (
    <a
      href="https://clarify.pub"
      target="_blank"
      rel="noreferrer"
      aria-label={t('builtWith.label')}
      className="clarify-built-with inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-medium no-underline transition"
    >
      <span>{t('builtWith.prefix')}</span>
      <img src={clarifyMarkUrl} alt="" className="clarify-built-with-logo h-3.5 w-5 flex-none" />
      <span className="clarify-built-with-brand font-semibold">Clarify</span>
    </a>
  )
}
