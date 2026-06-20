import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { clsx } from 'clsx/lite'

import Link from '../primitives/router-link'
import { Dialog, DialogPanel } from '../primitives/interactive'

export function NavbarLink({
  children,
  href,
  className,
  ...props
}: { href: string } & Omit<ComponentProps<'a'>, 'href'>) {
  return (
    <Link
      href={href}
      className={clsx(
        'group inline-flex items-center justify-between gap-2 text-3xl/10 font-medium text-mist-950 lg:text-sm/7 dark:text-white',
        className,
      )}
      {...props}
    >
      {children}
      <span className="inline-flex p-1.5 opacity-0 group-hover:opacity-100 lg:hidden" aria-hidden="true">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </span>
    </Link>
  )
}

export function NavbarLogo({ className, href, ...props }: { href: string } & Omit<ComponentProps<'a'>, 'href'>) {
  return <Link href={href} {...props} className={clsx('inline-flex items-stretch', className)} />
}

export function NavbarWithLinksActionsAndCenteredLogo({
  links,
  logo,
  actions,
  className,
  ...props
}: {
  links: ReactNode
  logo: ReactNode
  actions: ReactNode
} & ComponentProps<'header'>) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className={clsx('sticky top-0 z-10 bg-mist-100 dark:bg-mist-950', className)} {...props}>
      <style>{`:root { --scroll-padding-top: 5.25rem }`}</style>
      <nav>
        <div className="mx-auto flex h-(--scroll-padding-top) max-w-7xl items-center gap-4 px-6 lg:px-10">
          <div className="flex flex-1 gap-8 max-lg:hidden">{links}</div>
          <div className="flex items-center">{logo}</div>
          <div className="flex flex-1 items-center justify-end gap-4">
            <div className="flex shrink-0 items-center gap-5 max-sm:hidden">{actions}</div>

            <button
              type="button"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Open menu"
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex rounded-full p-1.5 text-mist-950 hover:bg-mist-950/10 lg:hidden dark:text-white dark:hover:bg-white/10"
            >
              <Menu className="size-6" aria-hidden="true" />
            </button>
          </div>
        </div>

        <Dialog className={clsx('lg:hidden', !isMobileMenuOpen && 'hidden')}>
          <div id="mobile-menu" role="dialog" aria-modal="true">
            <DialogPanel className="fixed inset-0 z-50 bg-mist-100 px-6 py-6 lg:px-10 dark:bg-mist-950">
              <div className="flex items-center justify-between">
                {logo}
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex rounded-full p-1.5 text-mist-950 hover:bg-mist-950/10 dark:text-white dark:hover:bg-white/10"
                >
                  <X className="size-6" aria-hidden="true" />
                </button>
              </div>
              <div onClick={() => setIsMobileMenuOpen(false)} className="mt-10 flex flex-col gap-6">
                {links}
              </div>
              <div className="mt-10 flex flex-col items-stretch gap-3" onClick={() => setIsMobileMenuOpen(false)}>
                {actions}
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      </nav>
    </header>
  )
}
