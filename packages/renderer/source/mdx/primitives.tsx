import clsx from 'clsx'
import { createElement, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Button, Heading, PageFooter, Prose } from '../components'
import { Code, CodeGroup, Pre } from '../components/Code'

export function wrapper(arg0: { children: ReactNode }) {  const { children } = arg0

  return (
    <article className="clarify-mdx-page flex h-full flex-col pt-16 pb-10">
      <Prose className="flex-auto">{children}</Prose>
      <PageFooter />
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
export { Button, CodeGroup }

export function h2(props: Omit<ComponentPropsWithoutRef<typeof Heading>, 'level'>) {
  return createElement(Heading, { level: 2, ...props })
}

export function h3(props: Omit<ComponentPropsWithoutRef<typeof Heading>, 'level'>) {
  return createElement(Heading, { level: 3, ...props })
}

function InfoIcon(props: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="8" strokeWidth="0" />
      <path fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6.75 7.75h1.5v3.5" />
      <circle cx="8" cy="4" r=".5" fill="none" />
    </svg>
  )
}

export function Note(arg0: { children: ReactNode }) {  const { children } = arg0

  return (
    <div className="clarify-note my-6 flex gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-4 text-sm/6 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/5 dark:text-emerald-200 dark:[--tw-prose-links-hover:var(--color-emerald-300)] dark:[--tw-prose-links:var(--color-white)]">
      <InfoIcon className="mt-1 h-4 w-4 flex-none fill-emerald-500 stroke-white dark:fill-emerald-200/20 dark:stroke-emerald-200" />
      <div className="*:first:mt-0 *:last:mb-0">{children}</div>
    </div>
  )
}

export function Row(arg0: { children: ReactNode }) {  const { children } = arg0

  return <div className="clarify-row grid grid-cols-1 items-start gap-x-16 gap-y-10 xl:max-w-none xl:grid-cols-2">{children}</div>
}

export function Col(arg0: { children: ReactNode; sticky?: boolean }) {  const { children, sticky = false } = arg0

  return <div className={clsx('clarify-col *:first:mt-0 *:last:mb-0', sticky && 'xl:sticky xl:top-24')}>{children}</div>
}

export function Properties(arg0: { children: ReactNode }) {  const { children } = arg0

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

export function Property(arg0: { name: string; children: ReactNode; type?: string }) {  const { name, children, type } = arg0

  return (
    <li className="clarify-property m-0 px-0 py-4 first:pt-0 last:pb-0">
      <dl className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2">
        <dt className="sr-only">Name</dt>
        <dd>
          <code>{name}</code>
        </dd>
        {type ? (
          <>
            <dt className="sr-only">Type</dt>
            <dd className="font-mono text-xs text-zinc-400 dark:text-zinc-500">{type}</dd>
          </>
        ) : null}
        <dt className="sr-only">Description</dt>
        <dd className="w-full flex-none *:first:mt-0 *:last:mb-0">{children}</dd>
      </dl>
    </li>
  )
}
