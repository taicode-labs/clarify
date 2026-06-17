import { LogoMark } from './icons'
import { docsLinks } from './links'

export function Footer() {
  return (
    <footer className="border-t border-zinc-900/10 px-6 py-10 dark:border-white/10 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Clarify</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">AGPL-3.0-only © 2026 Taicode Labs</p>
          </div>
        </div>
        <div className="flex gap-6 text-sm text-zinc-500 dark:text-zinc-400">
          <a href={docsLinks.gettingStarted} className="transition hover:text-zinc-900 dark:hover:text-white">Docs</a>
          <a href={docsLinks.openapi} className="transition hover:text-zinc-900 dark:hover:text-white">API</a>
          <a href={docsLinks.github} className="transition hover:text-zinc-900 dark:hover:text-white">GitHub</a>
        </div>
      </div>
    </footer>
  )
}
