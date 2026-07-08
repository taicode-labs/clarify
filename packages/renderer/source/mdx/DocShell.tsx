import type { ReactNode } from 'react'

import { Prose } from '../components/Prose'

export type DocShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export function DocShell(arg0: DocShellProps) {
  const { title, subtitle, children } = arg0

  return (
    <main className="clarify-doc-shell min-h-screen bg-(--clarify-theme-tokens-colors-background) px-6 py-10 text-(--clarify-theme-tokens-colors-foreground) md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{title}</h1>
          {subtitle ? <p className="mt-3 max-w-2xl text-(--clarify-ui-text-soft)">{subtitle}</p> : null}
        </header>
        <Prose>{children}</Prose>
      </div>
    </main>
  )
}
