import type { ComponentProps } from 'react'

export function ClarifyLogo(props: ComponentProps<'span'>) {
  const { className, ...spanProps } = props

  return (
    <span
      className={className ?? 'inline-flex h-8 items-center gap-1.5 text-sm font-semibold tracking-tight text-(--clarify-ui-text-strong)'}
      {...spanProps}
    >
      <img
        src="/clarify.svg"
        alt=""
        width={28}
        height={20}
        className="h-5 w-auto object-contain"
      />
      Clarify
    </span>
  )
}
