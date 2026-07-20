import clsx from 'clsx'
import { Info } from 'lucide-react'
import { createElement, type ComponentPropsWithoutRef, type ReactNode } from 'react'

import { PageTitleActions } from '../app/PageActions'
import { AccordionGroup, Button, Callout, Card, CardGroup, FileTree, FileTreeItem, Heading, LocalizedLink, Prose, Step, Steps, Tab, Tabs, Tooltip, WebFrame } from '../components'
import { Code, CodeGroup, Pre } from '../components/Code'
import { Image } from '../components/Image'

type WrapperProps = { children: ReactNode }

export function wrapper(arg0: WrapperProps) {
  const { children } = arg0

  return (
    <article className="clarify-mdx-page flex h-full min-w-0 flex-col pt-14 pb-10">
      <Prose className="flex-auto">{children}</Prose>
    </article>
  )
}

export function table(arg0: ComponentPropsWithoutRef<'table'>) {
  const { className, ...props } = arg0
  return (
    <div className="overflow-x-auto">
      <table className={className} {...props} />
    </div>
  )
}

export function a(arg0: ComponentPropsWithoutRef<'a'>) {
  const { href = '', ...props } = arg0

  return <LocalizedLink href={href} {...props} />
}

export function h1(arg0: ComponentPropsWithoutRef<'h1'>) {
  const { children, className, ...props } = arg0

  return (
    <div className="clarify-page-title-row flex flex-col gap-4  pb-4 sm:flex-row sm:items-start sm:justify-between">
      <h1 className={clsx('clarify-page-title min-w-0 flex-1', className)} {...props}>{children}</h1>
      <PageTitleActions />
    </div>
  )
}

export const code = Code
export const pre = Pre
export const img = Image
export { AccordionGroup, Button, Callout, Card, CardGroup, CodeGroup, FileTree, FileTreeItem, Step, Steps, Tab, Tabs, Tooltip, WebFrame }

export function h2(props: Omit<ComponentPropsWithoutRef<typeof Heading>, 'level'>) {
  return createElement(Heading, { level: 2, ...props })
}

export function h3(props: Omit<ComponentPropsWithoutRef<typeof Heading>, 'level'>) {
  return createElement(Heading, { level: 3, ...props })
}

type NoteProps = { children: ReactNode }

export function Note(arg0: NoteProps) {
  const { children } = arg0

  return (
    <div className="clarify-note my-6 flex gap-3 rounded-r-(--clarify-theme-tokens-radius-lg) border-l-2 border-(--clarify-theme-tokens-colors-primary) bg-(--clarify-ui-subtle-background) px-4 py-3 text-sm/6 text-(--clarify-ui-text-soft) [--tw-prose-links-hover:var(--clarify-ui-accent-text)] [--tw-prose-links:var(--clarify-theme-tokens-colors-foreground)]">
      <Info className="mt-1 size-4 flex-none stroke-(--clarify-ui-accent-text)" />
      <div className="*:first:mt-0 *:last:mb-0">{children}</div>
    </div>
  )
}

type RowProps = { children: ReactNode, className?: string }

export function Row(arg0: RowProps) {
  const { children, className } = arg0

  return <div className={clsx('clarify-row grid grid-cols-1 items-start gap-x-8 gap-y-10 xl:max-w-none xl:grid-cols-2', className)}>{children}</div>
}

type ColProps = { children: ReactNode; sticky?: boolean }

export function Col(arg0: ColProps) {
  const { children, sticky = false } = arg0

  return <div className={clsx('clarify-col *:first:mt-0 *:last:mb-0', sticky && 'xl:sticky xl:top-[calc(var(--clarify-header-offset,3.5rem)+1.5rem)] xl:self-start')}>{children}</div>
}

type PropertiesProps = { children: ReactNode; className?: string; spacingClassName?: string }

export function Properties(arg0: PropertiesProps) {
  const { children, className, spacingClassName = 'my-6' } = arg0

  return (
    <div className={clsx('clarify-properties', spacingClassName, className)}>
      <ul
        role="list"
        className="m-0 list-none divide-y divide-(--clarify-theme-tokens-colors-border) p-0"
      >
        {children}
      </ul>
    </div>
  )
}

type PropertyProps = { name: string; children: ReactNode; type?: string }

export function Property(arg0: PropertyProps) {
  const { name, children, type } = arg0

  return (
    <li className="clarify-property m-0 px-0 py-4 first:pt-0 last:pb-0">
      <dl className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2">
        <dt className="sr-only">Name</dt>
        <dd>
          <span className="text-sm/5 font-semibold text-(--clarify-theme-tokens-colors-foreground)">{name}</span>
        </dd>
        {type ? (
          <>
            <dt className="sr-only">Type</dt>
            <dd className="text-xs text-(--clarify-theme-tokens-colors-muted)">{type}</dd>
          </>
        ) : null}
        <dt className="sr-only">Description</dt>
        <dd className="w-full flex-none *:first:mt-0 *:last:mb-0">{children}</dd>
      </dl>
    </li>
  )
}
