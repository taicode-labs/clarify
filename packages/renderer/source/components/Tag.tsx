import clsx from 'clsx'
import type { ReactNode } from 'react'

const tagVariantStyles = {
  small: '',
  medium: 'rounded-lg px-1.5 ring-1 ring-inset',
}

const tagColorStyles = {
  emerald: {
    small: 'text-emerald-500 dark:text-emerald-400',
    medium: 'bg-emerald-400/10 text-emerald-500 ring-emerald-300 dark:text-emerald-400 dark:ring-emerald-400/30',
  },
  sky: {
    small: 'text-sky-500 dark:text-sky-400',
    medium: 'bg-sky-400/10 text-sky-500 ring-sky-300 dark:text-sky-400 dark:ring-sky-400/30',
  },
  amber: {
    small: 'text-amber-500 dark:text-amber-400',
    medium: 'bg-amber-400/10 text-amber-500 ring-amber-300 dark:text-amber-400 dark:ring-amber-400/30',
  },
  rose: {
    small: 'text-red-500 dark:text-rose-500',
    medium: 'bg-rose-50 text-red-500 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-400 dark:ring-rose-500/20',
  },
  zinc: {
    small: 'text-(--clarify-theme-tokens-colors-muted)',
    medium: 'bg-(--clarify-theme-tokens-colors-code-background) text-(--clarify-theme-tokens-colors-muted) ring-(--clarify-theme-tokens-colors-border)',
  },
}

const tagValueColorMap: Record<string, keyof typeof tagColorStyles> = {
  GET: 'emerald',
  POST: 'sky',
  PUT: 'amber',
  PATCH: 'amber',
  DELETE: 'rose',
}

export type TagProps = {
  children: ReactNode
  variant?: keyof typeof tagVariantStyles
  color?: keyof typeof tagColorStyles
}

export function Tag(arg0: TagProps) {
  const { children, variant = 'medium', color } = arg0

  const value = typeof children === 'string' ? children.toUpperCase() : ''
  const resolvedColor = color ?? tagValueColorMap[value] ?? 'emerald'

  return (
    <span
      className={clsx(
        'clarify-tag font-bold',
        tagVariantStyles[variant],
        tagColorStyles[resolvedColor][variant],
      )}
    >
      {children}
    </span>
  )
}
