import clsx from 'clsx'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

export type StepsProps = {
  children: ReactNode
  className?: string
} & Omit<ComponentPropsWithoutRef<'ol'>, 'children' | 'className'>

export function Steps(arg0: StepsProps) {
  const { children, className, ...props } = arg0

  return (
    <ol
      className={clsx('clarify-steps my-8 ml-3 list-none border-l-2 border-(--clarify-theme-tokens-colors-border) p-0', className)}
      {...props}
    >
      {children}
    </ol>
  )
}

export type StepProps = {
  children: ReactNode
  title?: ReactNode
  className?: string
} & Omit<ComponentPropsWithoutRef<'li'>, 'children' | 'className' | 'title'>

export function Step(arg0: StepProps) {
  const { children, title, className, ...props } = arg0

  return (
    <li
      className={clsx('clarify-step relative m-0 pb-10 pl-9 last:pb-0', className)}
      {...props}
    >
      <span className="absolute top-0 -left-3.5 flex size-7 items-center justify-center rounded-full bg-(--clarify-theme-tokens-colors-primary) text-xs font-semibold text-white shadow-[0_0_0_4px_var(--clarify-theme-tokens-colors-background)] before:content-[counter(list-item)] dark:text-zinc-950" aria-hidden="true" />
      {title ? <h3 className="m-0 pt-0.5 text-base font-semibold text-(--clarify-theme-tokens-colors-foreground)">{title}</h3> : null}
      <div className={clsx('text-sm/6 text-(--clarify-ui-text-soft) *:last:mb-0', title && 'mt-2.5', !title && '*:first:mt-0')}>
        {children}
      </div>
    </li>
  )
}
