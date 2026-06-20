import type { ComponentProps } from 'react'

export function ClarifyLogo(props: ComponentProps<'span'>) {
  const { className, ...spanProps } = props

  return (
    <span
      className={className ?? 'inline-flex h-9 items-center gap-1.5 text-base font-semibold tracking-tight text-mist-950 dark:text-white'}
      {...spanProps}
    >
      <img
        src="/clarify.svg"
        alt=""
        width={34}
        height={24}
        className="h-6 w-auto object-contain"
      />
      Clarify
    </span>
  )
}
