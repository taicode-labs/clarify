import clsx from 'clsx'

import { useBuiltInText } from '../../core/i18n'

type DeprecatedBadgeProps = { className?: string }

export function DeprecatedBadge(props: DeprecatedBadgeProps) {
  const { className } = props
  const t = useBuiltInText()

  // Neutral on purpose: deprecation reads as "fading away", not as an amber release highlight.
  return (
    <span className={clsx('clarify-deprecated-badge inline-flex shrink-0 items-center rounded-(--clarify-theme-tokens-radius-sm) bg-(--clarify-tone-neutral-background) px-1.5 py-0.5 align-middle text-xs font-normal leading-4 whitespace-nowrap text-(--clarify-theme-tokens-colors-muted)', className)}>
      {t('openapi.deprecated')}
    </span>
  )
}
