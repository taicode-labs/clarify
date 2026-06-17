import { Button } from './Button'
import { LogoMark } from './icons'
import { docsLinks, primaryNavLinks } from './links'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-900/10 bg-white/85 backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <a href={docsLinks.home} className="flex items-center gap-3 no-underline">
          <LogoMark />
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">Clarify</span>
        </a>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          {primaryNavLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a href={docsLinks.github} className="hidden text-sm text-zinc-600 transition hover:text-zinc-900 sm:block dark:text-zinc-400 dark:hover:text-white">
            GitHub
          </a>
          <ThemeToggle />
          <Button href={docsLinks.gettingStarted} variant="secondary">Get started</Button>
        </div>
      </div>
    </header>
  )
}
