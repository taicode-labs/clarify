import clsx from 'clsx'
import { AlertTriangle, CheckCircle2, Info, Lightbulb, XCircle } from 'lucide-react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { useBuiltInText } from '../core/i18n'

export type CalloutType = 'info' | 'note' | 'tip' | 'warning' | 'danger' | 'success'

type CalloutStyle = {
  container: string
  icon: string
  title: string
  Icon: typeof Info
}

const calloutStyles: Record<CalloutType, CalloutStyle> = {
  info: {
    container: 'border-sky-500/20 bg-sky-50/50 text-sky-950 dark:border-sky-400/30 dark:bg-sky-400/5 dark:text-sky-100',
    icon: 'text-sky-600 dark:text-sky-400',
    title: 'text-sky-900 dark:text-sky-100',
    Icon: Info,
  },
  note: {
    container: 'border-zinc-500/20 bg-zinc-50 text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200',
    icon: 'text-zinc-500 dark:text-zinc-400',
    title: 'text-zinc-900 dark:text-white',
    Icon: Info,
  },
  tip: {
    container: 'border-emerald-500/20 bg-emerald-50/50 text-emerald-950 dark:border-emerald-400/30 dark:bg-emerald-400/5 dark:text-emerald-100',
    icon: 'text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-900 dark:text-emerald-100',
    Icon: Lightbulb,
  },
  warning: {
    container: 'border-amber-500/20 bg-amber-50/70 text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/5 dark:text-amber-100',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-900 dark:text-amber-100',
    Icon: AlertTriangle,
  },
  danger: {
    container: 'border-rose-500/20 bg-rose-50/70 text-rose-950 dark:border-rose-400/30 dark:bg-rose-400/5 dark:text-rose-100',
    icon: 'text-rose-600 dark:text-rose-400',
    title: 'text-rose-900 dark:text-rose-100',
    Icon: XCircle,
  },
  success: {
    container: 'border-emerald-500/20 bg-emerald-50/50 text-emerald-950 dark:border-emerald-400/30 dark:bg-emerald-400/5 dark:text-emerald-100',
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
        'clarify-callout my-6 flex gap-3 rounded-(--clarify-theme-tokens-radius-xl) border p-4 text-sm/6',
        style.container,
        className,
      )}
      {...props}
    >
      {icon ? <Icon className={clsx('mt-1 size-4 flex-none', style.icon)} aria-hidden="true" /> : null}
      <div className="min-w-0 flex-1 *:first:mt-0 *:last:mb-0">
        {resolvedTitle ? <p className={clsx('mb-1 font-semibold', style.title)}>{resolvedTitle}</p> : null}
        <div className="*:first:mt-0 *:last:mb-0">{children}</div>
      </div>
    </div>
  )
}
