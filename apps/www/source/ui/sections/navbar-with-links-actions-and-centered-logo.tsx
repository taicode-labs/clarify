import { clsx } from 'clsx/lite'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'

import { Dialog, DialogPanel } from '../primitives/interactive'
import Link from '../primitives/router-link'

export function NavbarLink(arg0: { href: string } & Omit<ComponentProps<'a'>, 'href'>) {  const {
  children,
  href,
  className,
  ...props
} = arg0

  return (
    <Link
      href={href}
      className={clsx(
        'group inline-flex items-center justify-between gap-2 text-3xl/10 font-medium text-(--clarify-ui-text-strong) lg:text-sm/7',
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

export function NavbarLogo(arg0: { href: string } & Omit<ComponentProps<'a'>, 'href'>) {  const { className, href, ...props } = arg0

  return <Link href={href} {...props} className={clsx('inline-flex items-stretch', className)} />
}

export function NavbarWithLinksActionsAndCenteredLogo(arg0: {
  links: ReactNode
  logo: ReactNode
  actions: ReactNode
} & ComponentProps<'header'>) {  const {
  links,
  logo,
  actions,
  className,
  ...props
} = arg0

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className={clsx('sticky top-0 z-10 bg-(--clarify-theme-tokens-colors-background)/90 backdrop-blur dark:bg-zinc-950/90', className)} {...props}>
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
              className="inline-flex rounded-full p-1.5 text-(--clarify-ui-text-strong) hover:bg-(--clarify-ui-hover-background) lg:hidden"
            >
              <Menu className="size-6" aria-hidden="true" />
            </button>
          </div>
        </div>

        <Dialog className={clsx('lg:hidden', !isMobileMenuOpen && 'hidden')}>
          <div id="mobile-menu" role="dialog" aria-modal="true">
            <DialogPanel className="fixed inset-0 z-50 bg-(--clarify-theme-tokens-colors-background) px-6 py-6 lg:px-10 dark:bg-zinc-950">
              <div className="flex items-center justify-between">
                {logo}
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex rounded-full p-1.5 text-(--clarify-ui-text-strong) hover:bg-(--clarify-ui-hover-background)"
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
