import clsx from 'clsx'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { lucideIconRegistry, resolveLucideIconName } from '../utils/lucide'

type CardIconProps = { name?: string }

function CardIcon(arg0: CardIconProps) {
  const { name } = arg0

  if (!name) return null

  const iconName = resolveLucideIconName(name)
  if (!iconName) return null

  const Icon = lucideIconRegistry[iconName]
  if (!Icon) return null

  return (
    <span className="flex size-9 flex-none items-center justify-center rounded-(--clarify-theme-tokens-radius-lg) bg-(--clarify-ui-accent-background) text-(--clarify-ui-accent-text) ring-1 ring-(--clarify-ui-accent-border)">
      <Icon className="size-5" aria-hidden="true" />
    </span>
  )
}

export type CardGroupProps = {
  children: ReactNode
  cols?: 1 | 2 | 3 | 4
  className?: string
}

const cardGroupColumnStyles: Record<NonNullable<CardGroupProps['cols']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

export function CardGroup(arg0: CardGroupProps) {
  const { children, cols = 2, className } = arg0

  return (
    <div className={clsx('not-prose my-10 grid gap-4', cardGroupColumnStyles[cols], className)}>
      {children}
    </div>
  )
}

export type CardProps = {
  title: string
  icon?: string
  href?: string
  children?: ReactNode
  className?: string
} & Omit<ComponentPropsWithoutRef<'a'>, 'children' | 'className' | 'href' | 'title'>

export function Card(arg0: CardProps) {
  const { title, icon, href, children, className, ...props } = arg0

  const content = (
    <>
      <div className="flex items-start gap-4">
        <CardIcon name={icon} />
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-base font-semibold text-(--clarify-theme-tokens-colors-foreground) dark:text-white">{title}</h3>
          {children ? (
            <div className="mt-2 text-sm/6 text-(--clarify-theme-tokens-colors-muted) dark:text-zinc-400 *:m-0">
              {children}
            </div>
          ) : null}
        </div>
      </div>
      {href ? <span className="absolute inset-0 rounded-(--clarify-theme-tokens-radius-xl)" aria-hidden="true" /> : null}
    </>
  )

  const classes = clsx(
    'group relative block rounded-(--clarify-theme-tokens-radius-xl) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-5 shadow-(--clarify-ui-accent-glow) transition hover:shadow-xs dark:bg-zinc-900/50',
    className,
  )

  if (!href) {
    return <div className={classes}>{content}</div>
  }

  if (href.startsWith('/') && !href.startsWith('//')) {
    return (
      <Link to={href} className={classes} {...props}>
        {content}
      </Link>
    )
  }

  return (
    <a href={href} className={classes} {...props}>
      {content}
    </a>
  )
}
