import type { ComponentProps } from 'react'

export function ClarifyLogo({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span className={className} {...props}>
      <span className="flex items-center gap-2 text-xl font-semibold tracking-tight text-mist-950 dark:text-white">
        <span className="grid size-8 place-items-center rounded-lg bg-mist-950 text-sm font-bold text-white dark:bg-white dark:text-mist-950">
          C
        </span>
        Clarify
      </span>
    </span>
  )
}
