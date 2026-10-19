import clsx from 'clsx'
import { AlertTriangle, CheckCircle2, Info, Lightbulb, XCircle } from 'lucide-react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { useBuiltInText } from '../core/i18n'

export type CalloutType = 'info' | 'note' | 'tip' | 'warning' | 'danger' | 'success'

type CalloutTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

type CalloutStyle = {
  tone: CalloutTone
  Icon: typeof Info
}

const calloutStyles: Record<CalloutType, CalloutStyle> = {
  info: { tone: 'info', Icon: Info },
  note: { tone: 'neutral', Icon: Info },
  tip: { tone: 'success', Icon: Lightbulb },
  warning: { tone: 'warning', Icon: AlertTriangle },
  danger: { tone: 'danger', Icon: XCircle },
  success: { tone: 'success', Icon: CheckCircle2 },
}

/**
 * Tone classes are written out (instead of interpolated) so Tailwind can see
 * them at build time. Colours come from --clarify-tone-* so every callout
 * follows the active theme preset.
 */
const calloutToneStyles: Record<CalloutTone, Omit<CalloutStyle, 'tone' | 'Icon'> & {
  container: string
  iconContainer: string
  icon: string
  title: string
}> = {
  neutral: {
    container:
      'border-(--clarify-tone-neutral-border) bg-(--clarify-tone-neutral-background)',
    iconContainer:
      'bg-(--clarify-tone-neutral-icon-background) ring-(--clarify-tone-neutral-border)',
    icon: 'text-(--clarify-tone-neutral-icon)',
    title: 'text-(--clarify-tone-neutral-text)',
  },
  info: {
    container:
      'border-(--clarify-tone-info-border) bg-(--clarify-tone-info-background)',
    iconContainer:
      'bg-(--clarify-tone-info-icon-background) ring-(--clarify-tone-info-border)',
    icon: 'text-(--clarify-tone-info-icon)',
    title: 'text-(--clarify-tone-info-text)',
  },
  success: {
    container:
      'border-(--clarify-tone-success-border) bg-(--clarify-tone-success-background)',
    iconContainer:
      'bg-(--clarify-tone-success-icon-background) ring-(--clarify-tone-success-border)',
    icon: 'text-(--clarify-tone-success-icon)',
    title: 'text-(--clarify-tone-success-text)',
  },
  warning: {
    container:
      'border-(--clarify-tone-warning-border) bg-(--clarify-tone-warning-background)',
    iconContainer:
      'bg-(--clarify-tone-warning-icon-background) ring-(--clarify-tone-warning-border)',
    icon: 'text-(--clarify-tone-warning-icon)',
    title: 'text-(--clarify-tone-warning-text)',
  },
  danger: {
    container:
      'border-(--clarify-tone-danger-border) bg-(--clarify-tone-danger-background)',
    iconContainer:
      'bg-(--clarify-tone-danger-icon-background) ring-(--clarify-tone-danger-border)',
    icon: 'text-(--clarify-tone-danger-icon)',
    title: 'text-(--clarify-tone-danger-text)',
  },
}

const defaultTitleKeys: Record<CalloutType, Parameters<ReturnType<typeof useBuiltInText>>[0]> = {
  info: 'callout.info',
  note: 'callout.note',
  tip: 'callout.tip',
  warning: 'callout.warning',
  danger: 'callout.danger',
  success: 'callout.success',
}

export type CalloutProps = {
  children: ReactNode
  type?: CalloutType
  title?: ReactNode
  icon?: boolean
  className?: string
} & Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className' | 'title'>

export function Callout(arg0: CalloutProps) {
  const {
    children,
    type = 'info',
    title,
    icon = true,
    className,
    ...props
  } = arg0

  const t = useBuiltInText()
  const style = calloutStyles[type]
  const toneStyle = calloutToneStyles[style.tone]
  const Icon = style.Icon
  const resolvedTitle = title === undefined ? t(defaultTitleKeys[type]) : title

  return (
    <div
      className={clsx(
        'clarify-callout my-6 flex gap-3.5 rounded-(--clarify-theme-tokens-radius-lg) border p-4 text-sm/6 text-(--clarify-ui-text-soft)',
        toneStyle.container,
        className,
      )}
      {...props}
    >
      {icon ? (
        <span className={clsx('flex size-7 flex-none items-center justify-center rounded-(--clarify-theme-tokens-radius-md) ring-1 ring-inset', toneStyle.iconContainer)}>
          <Icon className={clsx('size-4', toneStyle.icon)} aria-hidden="true" />
        </span>
      ) : null}
      <div className="min-w-0 flex-1 *:first:mt-0 *:last:mb-0">
        {resolvedTitle ? <p className={clsx('mb-1.5 font-semibold', toneStyle.title)}>{resolvedTitle}</p> : null}
        <div className="*:first:mt-0 *:last:mb-0">{children}</div>
      </div>
    </div>
  )
}
