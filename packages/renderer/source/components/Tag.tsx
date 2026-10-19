import clsx from 'clsx'
import type { ReactNode } from 'react'

const tagVariantStyles = {
  small: '',
  medium: 'rounded-(--clarify-theme-tokens-radius-md) px-1.5 ring-1 ring-inset',
}

const tagColorStyles = {
  emerald: {
    small: 'text-(--clarify-tone-success-icon)',
    medium: 'bg-(--clarify-tone-success-background) text-(--clarify-tone-success-text) ring-(--clarify-tone-success-border)',
  },
  sky: {
    small: 'text-(--clarify-tone-info-icon)',
    medium: 'bg-(--clarify-tone-info-background) text-(--clarify-tone-info-text) ring-(--clarify-tone-info-border)',
  },
  amber: {
    small: 'text-(--clarify-tone-warning-icon)',
    medium: 'bg-(--clarify-tone-warning-background) text-(--clarify-tone-warning-text) ring-(--clarify-tone-warning-border)',
  },
  rose: {
    small: 'text-(--clarify-tone-danger-icon)',
    medium: 'bg-(--clarify-tone-danger-background) text-(--clarify-tone-danger-text) ring-(--clarify-tone-danger-border)',
  },
  zinc: {
    small: 'text-(--clarify-theme-tokens-colors-muted)',
    medium: 'bg-(--clarify-tone-neutral-background) text-(--clarify-theme-tokens-colors-muted) ring-(--clarify-tone-neutral-border)',
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
