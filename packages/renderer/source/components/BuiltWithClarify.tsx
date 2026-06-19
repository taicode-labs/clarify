import type { ComponentPropsWithoutRef } from 'react'

function ClarifyMark(props: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 279 200" aria-hidden="true" {...props}>
      <path d="M44.867217 0.00543761C130.715579 1.00591567 200 70.9091172 200 156.994562L199.986321 155.127494C199.384888 180.009127 179.026368 199.994562 154 199.994562H46C20.5949015 199.994562 0 179.399661 0 153.994562V45.9945624C0 21.0975659 19.7793434 0.820282524 44.4815926 0.0191499894Z" fill="#00D492" />
      <path d="M123.867217 0.00543761C209.715579 1.00591567 279 70.9091172 279 156.994562L278.986321 155.127494C278.384888 180.009127 258.026368 199.994562 233 199.994562H125C99.5949015 199.994562 79 179.399661 79 153.994562V45.9945624C79 21.0975659 98.7793434 0.820282524 123.481593 0.0191499894Z" fill="#00F6C9" fillOpacity="0.6" transform="rotate(-90 179 100)" />
      <path d="M199.979267 154.416906L199.984438 155.157125L199.962366 155.872459C198.977251 180.406837 178.776104 199.994562 154 199.994562L124.372438 199.994125L124.249053 199.994081C99.6939678 199.603921 79.8122712 179.973634 79.01915 155.518407L79.0054376 155.132783C79.5830823 105.566626 103.129768 61.5221348 139.498462 33.1463428C175.69419 61.3871018 199.186123 105.143863 199.979267 154.416906Z" fill="#00F692" />
    </svg>
  )
}

export function BuiltWithClarify() {
  return (
    <a
      href="https://clarify.pub"
      target="_blank"
      rel="noreferrer"
      aria-label="Built with Clarify"
      className="clarify-built-with inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-(--clarify-theme-tokens-colors-muted) no-underline transition hover:bg-[color-mix(in_srgb,var(--clarify-theme-tokens-colors-foreground)_3%,transparent)] hover:text-(--clarify-theme-tokens-colors-foreground) dark:text-zinc-500 dark:hover:bg-white/5 dark:hover:text-white"
    >
      <span>Built with</span>
      <ClarifyMark className="clarify-built-with-logo h-3.5 w-5 flex-none" />
      <span className="font-semibold text-(--clarify-theme-tokens-colors-foreground) dark:text-zinc-300">Clarify</span>
    </a>
  )
}
