import clsx from 'clsx'

import { useBuiltInText } from '../../core/i18n'

type DeprecatedBadgeProps = { className?: string }

export function DeprecatedBadge(props: DeprecatedBadgeProps) {
  const { className } = props
  const t = useBuiltInText()

  return (
    <span className={clsx('inline-flex shrink-0 items-center rounded-(--clarify-theme-tokens-radius-sm) border border-(--clarify-tone-warning-border) bg-(--clarify-tone-warning-background) px-1.5 py-0.5 align-middle text-xs font-medium leading-4 whitespace-nowrap text-(--clarify-tone-warning-text)', className)}>
      {t('openapi.deprecated')}
    </span>
  )
}
