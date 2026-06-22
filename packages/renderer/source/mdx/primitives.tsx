import clsx from 'clsx'
import { Info } from 'lucide-react'
import { createElement, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Button, Callout, Card, CardGroup, Heading, Prose } from '../components'
import { Code, CodeGroup, Pre } from '../components/Code'

type WrapperProps = { children: ReactNode }

export function wrapper(arg0: WrapperProps) {  const { children } = arg0

  return (
    <article className="clarify-mdx-page flex h-full flex-col pt-16 pb-10">
      <Prose className="flex-auto">{children}</Prose>
    </article>
  )
}

export function a(arg0: ComponentPropsWithoutRef<'a'>) {  const { href = '', ...props } = arg0

  if (href.startsWith('/') && !href.startsWith('//')) {
    return <Link to={href} {...props} />
  }

  return <a href={href} {...props} />
}

export const code = Code
export const pre = Pre
export { Button, Callout, Card, CardGroup, CodeGroup }

export function h2(props: Omit<ComponentPropsWithoutRef<typeof Heading>, 'level'>) {
  return createElement(Heading, { level: 2, ...props })
}

export function h3(props: Omit<ComponentPropsWithoutRef<typeof Heading>, 'level'>) {
  return createElement(Heading, { level: 3, ...props })
}

type NoteProps = { children: ReactNode }

export function Note(arg0: NoteProps) {  const { children } = arg0

  return (
    <div className="clarify-note my-6 flex gap-2.5 rounded-(--clarify-theme-tokens-radius-xl) border border-(--clarify-ui-accent-border) bg-(--clarify-ui-accent-background) p-4 text-sm/6 text-(--clarify-theme-tokens-colors-foreground) dark:text-zinc-100 dark:[--tw-prose-links-hover:var(--clarify-ui-accent-text)] dark:[--tw-prose-links:var(--color-white)]">
      <Info className="mt-1 h-4 w-4 flex-none stroke-(--clarify-ui-accent-text)" />
      <div className="*:first:mt-0 *:last:mb-0">{children}</div>
    </div>
  )
}

type RowProps = { children: ReactNode }

export function Row(arg0: RowProps) {  const { children } = arg0

  return <div className="clarify-row grid grid-cols-1 items-start gap-x-8 gap-y-10 xl:max-w-none xl:grid-cols-2">{children}</div>
}

type ColProps = { children: ReactNode; sticky?: boolean }

export function Col(arg0: ColProps) {  const { children, sticky = false } = arg0

  return <div className={clsx('clarify-col *:first:mt-0 *:last:mb-0', sticky && 'xl:sticky xl:top-24')}>{children}</div>
}

type PropertiesProps = { children: ReactNode }

export function Properties(arg0: PropertiesProps) {  const { children } = arg0

  return (
    <div className="clarify-properties my-6">
      <ul
        role="list"
        className="m-0 list-none divide-y divide-zinc-900/5 p-0 dark:divide-white/5"
      >
        {children}
      </ul>
    </div>
  )
}

type PropertyProps = { name: string; children: ReactNode; type?: string }

export function Property(arg0: PropertyProps) {  const { name, children, type } = arg0

  return (
    <li className="clarify-property m-0 px-0 py-4 first:pt-0 last:pb-0">
      <dl className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2">
        <dt className="sr-only">Name</dt>
        <dd>
          <span className="text-sm/5 font-semibold text-zinc-950 dark:text-white">{name}</span>
        </dd>
        {type ? (
          <>
            <dt className="sr-only">Type</dt>
            <dd className="text-xs text-(--clarify-theme-tokens-colors-muted) dark:text-zinc-500">{type}</dd>
          </>
        ) : null}
        <dt className="sr-only">Description</dt>
        <dd className="w-full flex-none *:first:mt-0 *:last:mb-0">{children}</dd>
      </dl>
    </li>
  )
}
