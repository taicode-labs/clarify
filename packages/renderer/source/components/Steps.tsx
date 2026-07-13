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
      className={clsx('clarify-steps my-8 ml-4 list-none border-l border-(--clarify-theme-tokens-colors-border) p-0', className)}
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
      className={clsx('clarify-step relative m-0 pb-8 pl-8 last:pb-0', className)}
      {...props}
    >
      <span className="absolute top-0 -left-3 flex size-6 items-center justify-center rounded-full border border-(--clarify-ui-accent-border) bg-(--clarify-theme-tokens-colors-background) text-xs font-semibold text-(--clarify-ui-accent-text) before:content-[counter(list-item)]" aria-hidden="true" />
      {title ? <h3 className="m-0 text-base font-semibold text-(--clarify-theme-tokens-colors-foreground)">{title}</h3> : null}
      <div className={clsx('text-sm/6 text-(--clarify-theme-tokens-colors-foreground) *:last:mb-0', title && 'mt-2', !title && '*:first:mt-0')}>
        {children}
      </div>
    </li>
  )
}
