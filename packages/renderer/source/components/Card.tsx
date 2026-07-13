import clsx from 'clsx'
import { ArrowUpRight } from 'lucide-react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { lucideIconRegistry, resolveLucideIconName } from '../utils/lucide'

import { LocalizedLink } from './LocalizedLink'

type CardIconProps = { name?: string }

function CardIcon(arg0: CardIconProps) {
  const { name } = arg0

  if (!name) return null

  const iconName = resolveLucideIconName(name)
  if (!iconName) return null

  const Icon = lucideIconRegistry[iconName]
  if (!Icon) return null

  return (
    <span className="flex size-8 flex-none items-center justify-center rounded-(--clarify-theme-tokens-radius-md) bg-(--clarify-ui-accent-background) text-(--clarify-ui-accent-text) ring-1 ring-inset ring-(--clarify-ui-accent-border) transition-colors group-hover:bg-(--clarify-theme-tokens-colors-primary) group-hover:text-white dark:group-hover:text-zinc-950">
      <Icon className="size-4" aria-hidden="true" />
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
    <div className={clsx('not-prose my-8 grid gap-3', cardGroupColumnStyles[cols], className)}>
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
          <div className="flex items-start justify-between gap-3">
            <h3 className="m-0 text-sm/6 font-semibold text-(--clarify-theme-tokens-colors-foreground)">{title}</h3>
            {href ? <ArrowUpRight className="mt-1 size-3.5 shrink-0 text-(--clarify-ui-text-faint) transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-(--clarify-ui-accent-text)" aria-hidden="true" /> : null}
          </div>
          {children ? (
            <div className="mt-1.5 text-sm/6 text-(--clarify-ui-text-soft) *:m-0">
              {children}
            </div>
          ) : null}
        </div>
      </div>
      {href ? <span className="absolute inset-0 rounded-(--clarify-theme-tokens-radius-xl)" aria-hidden="true" /> : null}
    </>
  )

  const classes = clsx(
    'group relative block rounded-(--clarify-theme-tokens-radius-lg) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) p-4 transition duration-200',
    href && 'hover:-translate-y-0.5 hover:border-(--clarify-ui-accent-border) hover:shadow-md hover:shadow-zinc-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--clarify-theme-tokens-colors-primary) focus-visible:ring-offset-2 dark:hover:shadow-none',
    className,
  )

  if (!href) {
    return <div className={classes}>{content}</div>
  }

  return (
    <LocalizedLink href={href} className={classes} {...props}>
      {content}
    </LocalizedLink>
  )
}
