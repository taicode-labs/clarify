import clsx from 'clsx'
import { AlertTriangle, CheckCircle2, Info, Lightbulb, XCircle } from 'lucide-react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { useBuiltInText } from '../core/i18n'

export type CalloutType = 'info' | 'note' | 'tip' | 'warning' | 'danger' | 'success'

type CalloutStyle = {
  container: string
  iconContainer: string
  icon: string
  title: string
  Icon: typeof Info
}

const calloutStyles: Record<CalloutType, CalloutStyle> = {
  info: {
    container: 'border-sky-500/20 bg-sky-50/30 dark:border-sky-400/20 dark:bg-sky-400/5',
    iconContainer: 'bg-sky-100 ring-sky-500/15 dark:bg-sky-400/10 dark:ring-sky-400/20',
    icon: 'text-sky-600 dark:text-sky-400',
    title: 'text-sky-900 dark:text-sky-100',
    Icon: Info,
  },
  note: {
    container: 'border-zinc-500/20 bg-zinc-50/50 dark:border-white/10 dark:bg-white/5',
    iconContainer: 'bg-zinc-200/70 ring-zinc-500/15 dark:bg-white/10 dark:ring-white/10',
    icon: 'text-zinc-500 dark:text-zinc-400',
    title: 'text-zinc-900 dark:text-white',
    Icon: Info,
  },
  tip: {
    container: 'border-emerald-500/20 bg-emerald-50/30 dark:border-emerald-400/20 dark:bg-emerald-400/5',
    iconContainer: 'bg-emerald-100 ring-emerald-500/15 dark:bg-emerald-400/10 dark:ring-emerald-400/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-900 dark:text-emerald-100',
    Icon: Lightbulb,
  },
  warning: {
    container: 'border-amber-500/20 bg-amber-50/40 dark:border-amber-400/20 dark:bg-amber-400/5',
    iconContainer: 'bg-amber-100 ring-amber-500/15 dark:bg-amber-400/10 dark:ring-amber-400/20',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-900 dark:text-amber-100',
    Icon: AlertTriangle,
  },
  danger: {
    container: 'border-rose-500/20 bg-rose-50/40 dark:border-rose-400/20 dark:bg-rose-400/5',
    iconContainer: 'bg-rose-100 ring-rose-500/15 dark:bg-rose-400/10 dark:ring-rose-400/20',
    icon: 'text-rose-600 dark:text-rose-400',
    title: 'text-rose-900 dark:text-rose-100',
    Icon: XCircle,
  },
  success: {
    container: 'border-emerald-500/20 bg-emerald-50/30 dark:border-emerald-400/20 dark:bg-emerald-400/5',
    iconContainer: 'bg-emerald-100 ring-emerald-500/15 dark:bg-emerald-400/10 dark:ring-emerald-400/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-900 dark:text-emerald-100',
    Icon: CheckCircle2,
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
  const Icon = style.Icon
  const resolvedTitle = title === undefined ? t(defaultTitleKeys[type]) : title

  return (
    <div
      className={clsx(
        'clarify-callout my-6 flex gap-3.5 rounded-(--clarify-theme-tokens-radius-lg) border p-4 text-sm/6 text-(--clarify-ui-text-soft)',
        style.container,
        className,
      )}
      {...props}
    >
      {icon ? (
        <span className={clsx('flex size-7 flex-none items-center justify-center rounded-(--clarify-theme-tokens-radius-md) ring-1 ring-inset', style.iconContainer)}>
          <Icon className={clsx('size-4', style.icon)} aria-hidden="true" />
        </span>
      ) : null}
      <div className="min-w-0 flex-1 *:first:mt-0 *:last:mb-0">
        {resolvedTitle ? <p className={clsx('mb-1.5 font-semibold', style.title)}>{resolvedTitle}</p> : null}
        <div className="*:first:mt-0 *:last:mb-0">{children}</div>
      </div>
    </div>
  )
}
