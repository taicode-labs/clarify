import type { ReactNode } from 'react'

type ButtonProps = {
  children: ReactNode
  href: string
  variant?: 'primary' | 'secondary' | 'text'
}

const variants = {
  primary: 'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400',
  secondary: 'bg-zinc-100 text-zinc-900 ring-1 ring-inset ring-zinc-900/10 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-300 dark:ring-white/10 dark:hover:bg-zinc-800',
  text: 'px-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300',
} as const

export function Button(arg0: ButtonProps) {
  const { children, href, variant = 'primary' } = arg0

  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-0.5 rounded-full px-4 py-2 text-sm font-medium transition ${variants[variant]}`}
    >
      {children}
    </a>
  )
}
