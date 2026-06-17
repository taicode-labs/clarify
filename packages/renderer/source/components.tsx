import type { ReactNode } from 'react'

export type DocShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export function DocShell(arg0: DocShellProps) {
  const { title, subtitle, children } = arg0

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold md:text-5xl">{title}</h1>
          {subtitle ? <p className="mt-3 max-w-2xl text-slate-600">{subtitle}</p> : null}
        </header>
        {children}
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
    <article id={id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm scroll-mt-20">
      <div className="flex items-center gap-3">
        <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
          {method}
        </span>
        <code className="text-sm font-medium text-slate-800">{path}</code>
      </div>
      {description ? <p className="mt-3 text-sm text-slate-600">{description}</p> : null}
    </article>
  )
}
