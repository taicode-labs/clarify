import clsx from 'clsx'
import * as LucideIcons from 'lucide-react'
import type { ComponentPropsWithoutRef, ComponentType, ReactNode, SVGProps } from 'react'
import { Link } from 'react-router-dom'

type LucideIconComponent = ComponentType<SVGProps<SVGSVGElement>>

function toPascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')
}

function CardIcon(arg0: { name?: string }) {
  const { name } = arg0

  if (!name) return null

  const iconName = toPascalCase(name)
  const Icon = (LucideIcons as unknown as Record<string, LucideIconComponent>)[iconName]

  if (!Icon) return null

  return (
    <span className="flex size-9 flex-none items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/10 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20">
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
          <h3 className="m-0 text-base font-semibold text-zinc-900 dark:text-white">{title}</h3>
          {children ? (
            <div className="mt-2 text-sm/6 text-zinc-600 dark:text-zinc-400 *:m-0">
              {children}
            </div>
          ) : null}
        </div>
      </div>
      {href ? <span className="absolute inset-0 rounded-2xl" aria-hidden="true" /> : null}
    </>
  )

  const classes = clsx(
    'group relative block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-white/10 dark:bg-zinc-900/50 dark:hover:border-emerald-400/40',
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
