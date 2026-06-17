import clsx from 'clsx'
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

function ArrowIcon(props: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m11.5 6.5 3 3.5m0 0-3 3.5m3-3.5h-9"
      />
    </svg>
  )
}

const buttonVariantStyles = {
  primary:
    'rounded-full bg-zinc-900 px-3 py-1 text-white hover:bg-zinc-700 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-1 dark:ring-inset dark:ring-emerald-400/20 dark:hover:text-emerald-300 dark:hover:ring-emerald-300',
  secondary:
    'rounded-full bg-zinc-100 px-3 py-1 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:ring-1 dark:ring-inset dark:ring-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-300',
  filled:
    'rounded-full bg-zinc-900 px-3 py-1 text-white hover:bg-zinc-700 dark:bg-emerald-500 dark:hover:bg-emerald-400',
  outline:
    'rounded-full px-3 py-1 text-zinc-700 ring-1 ring-inset ring-zinc-900/10 hover:bg-zinc-900/2.5 hover:text-zinc-900 dark:text-zinc-400 dark:ring-white/10 dark:hover:bg-white/5 dark:hover:text-white',
  text: 'text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-500',
}

export type ButtonProps = {
  variant?: keyof typeof buttonVariantStyles
  arrow?: 'left' | 'right'
} & (
  | (ComponentPropsWithoutRef<'a'> & { href: string })
  | (ComponentPropsWithoutRef<'button'> & { href?: undefined })
)

export function Button({ variant = 'primary', className, children, arrow, ...props }: ButtonProps) {
  const classes = clsx(
    'inline-flex justify-center gap-0.5 overflow-hidden text-sm font-medium transition',
    buttonVariantStyles[variant],
    className,
  )

  const arrowIcon = (
    <ArrowIcon
      className={clsx(
        'mt-0.5 h-5 w-5',
        variant === 'text' && 'relative top-px',
        arrow === 'left' && '-ml-1 rotate-180',
        arrow === 'right' && '-mr-1',
      )}
    />
  )

  const inner = (
    <>
      {arrow === 'left' ? arrowIcon : null}
      {children}
      {arrow === 'right' ? arrowIcon : null}
    </>
  )

  if (typeof props.href === 'undefined') {
    return (
      <button className={classes} {...props}>
        {inner}
      </button>
    )
  }

  return (
    <a className={classes} {...props}>
      {inner}
    </a>
  )
}

const tagVariantStyles = {
  small: '',
  medium: 'rounded-lg px-1.5 ring-1 ring-inset',
}

const tagColorStyles = {
  emerald: {
    small: 'text-emerald-500 dark:text-emerald-400',
    medium: 'bg-emerald-400/10 text-emerald-500 ring-emerald-300 dark:text-emerald-400 dark:ring-emerald-400/30',
  },
  sky: {
    small: 'text-sky-500 dark:text-sky-400',
    medium: 'bg-sky-400/10 text-sky-500 ring-sky-300 dark:text-sky-400 dark:ring-sky-400/30',
  },
  amber: {
    small: 'text-amber-500 dark:text-amber-400',
    medium: 'bg-amber-400/10 text-amber-500 ring-amber-300 dark:text-amber-400 dark:ring-amber-400/30',
  },
  rose: {
    small: 'text-red-500 dark:text-rose-500',
    medium: 'bg-rose-50 text-red-500 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-400 dark:ring-rose-500/20',
  },
  zinc: {
    small: 'text-zinc-400 dark:text-zinc-500',
    medium: 'bg-zinc-50 text-zinc-500 ring-zinc-200 dark:bg-zinc-400/10 dark:text-zinc-400 dark:ring-zinc-500/20',
  },
}

const tagValueColorMap: Record<string, keyof typeof tagColorStyles> = {
  GET: 'emerald',
  POST: 'sky',
  PUT: 'amber',
  PATCH: 'amber',
  DELETE: 'rose',
}

export type TagProps = {
  children: ReactNode
  variant?: keyof typeof tagVariantStyles
  color?: keyof typeof tagColorStyles
}

export function Tag({ children, variant = 'medium', color }: TagProps) {
  const value = typeof children === 'string' ? children.toUpperCase() : ''
  const resolvedColor = color ?? tagValueColorMap[value] ?? 'emerald'

  return (
    <span
      className={clsx(
        'font-mono text-[0.625rem]/6 font-semibold',
        tagVariantStyles[variant],
        tagColorStyles[resolvedColor][variant],
      )}
    >
      {children}
    </span>
  )
}

export function Logo(props: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 99 24" aria-hidden="true" {...props}>
      <path
        className="fill-emerald-400"
        d="M16 8a5 5 0 0 0-5-5H5a5 5 0 0 0-5 5v13.927a1 1 0 0 0 1.623.782l3.684-2.93a4 4 0 0 1 2.49-.87H11a5 5 0 0 0 5-5V8Z"
      />
      <path
        className="fill-zinc-900 dark:fill-white"
        d="M26.538 18h2.654v-3.999h2.576c2.672 0 4.456-1.723 4.456-4.333V9.65c0-2.61-1.784-4.333-4.456-4.333h-5.23V18Zm4.58-10.582c1.52 0 2.416.8 2.416 2.241v.018c0 1.441-.896 2.25-2.417 2.25h-1.925V7.418h1.925ZM38.051 18h2.566v-5.414c0-1.371.923-2.206 2.382-2.206.396 0 .791.061 1.178.15V8.287a3.843 3.843 0 0 0-.958-.123c-1.257 0-2.136.615-2.443 1.661h-.159V8.323h-2.566V18Zm11.55.202c2.979 0 4.772-1.88 4.772-5.036v-.018c0-3.128-1.82-5.036-4.773-5.036-2.953 0-4.772 1.916-4.772 5.036v.018c0 3.146 1.793 5.036 4.772 5.036Zm0-2.013c-1.372 0-2.145-1.116-2.145-3.023v-.018c0-1.89.782-3.023 2.144-3.023 1.354 0 2.145 1.134 2.145 3.023v.018c0 1.907-.782 3.023-2.145 3.023Zm10.52 1.846c.492 0 .967-.053 1.283-.114v-1.907a6.057 6.057 0 0 1-.755.044c-.87 0-1.24-.387-1.24-1.257v-4.544h1.995V8.323H59.41V6.012h-2.592v2.311h-1.495v1.934h1.495v5.133c0 1.88.949 2.645 3.304 2.645Zm7.287.167c2.98 0 4.772-1.88 4.772-5.036v-.018c0-3.128-1.82-5.036-4.772-5.036-2.954 0-4.773 1.916-4.773 5.036v.018c0 3.146 1.793 5.036 4.773 5.036Zm0-2.013c-1.372 0-2.145-1.116-2.145-3.023v-.018c0-1.89.782-3.023 2.145-3.023 1.353 0 2.144 1.134 2.144 3.023v.018c0 1.907-.782 3.023-2.144 3.023Zm10.767 2.013c2.522 0 4.034-1.353 4.297-3.463l.01-.053h-2.374l-.017.036c-.229.966-.853 1.467-1.908 1.467-1.37 0-2.135-1.08-2.135-3.04v-.018c0-1.934.755-3.006 2.135-3.006 1.099 0 1.74.615 1.908 1.556l.008.017h2.391v-.026c-.228-2.162-1.749-3.56-4.315-3.56-3.033 0-4.738 1.837-4.738 5.019v.017c0 3.217 1.714 5.054 4.738 5.054Zm10.257 0c2.98 0 4.772-1.88 4.772-5.036v-.018c0-3.128-1.82-5.036-4.772-5.036-2.953 0-4.773 1.916-4.773 5.036v.018c0 3.146 1.793 5.036 4.773 5.036Zm0-2.013c-1.371 0-2.145-1.116-2.145-3.023v-.018c0-1.89.782-3.023 2.145-3.023 1.353 0 2.144 1.134 2.144 3.023v.018c0 1.907-.782 3.023-2.144 3.023ZM95.025 18h2.566V4.623h-2.566V18Z"
      />
    </svg>
  )
}

export function Prose<T extends ElementType = 'div'>({
  as,
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'> & {
  as?: T
  className?: string
}) {
  const Component = as ?? 'div'

  return (
    <Component
      className={clsx(
        className,
        'prose dark:prose-invert',
        '[html_:where(&>*)]:mx-auto [html_:where(&>*)]:max-w-2xl lg:[html_:where(&>*)]:mx-[calc(50%-min(50%,var(--container-lg)))] lg:[html_:where(&>*)]:max-w-3xl',
      )}
      {...props}
    />
  )
}

export type DocShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export function DocShell(arg0: DocShellProps) {
  const { title, subtitle, children } = arg0

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-zinc-900 dark:bg-zinc-900 dark:text-white md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{title}</h1>
          {subtitle ? <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">{subtitle}</p> : null}
        </header>
        <Prose>{children}</Prose>
      </div>
    </main>
  )
}

export type ApiEndpointCardProps = {
  id?: string
  method: string
  path: string
  description?: string
}

export function ApiEndpointCard(arg0: ApiEndpointCardProps) {
  const { method, path, description, id } = arg0

  return (
    <article id={id} className="scroll-mt-20 rounded-2xl border border-zinc-900/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <Tag>{method}</Tag>
        <code className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{path}</code>
      </div>
      {description ? <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{description}</p> : null}
    </article>
  )
}
