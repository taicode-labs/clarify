import { clsx } from 'clsx/lite'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'

import { Dialog, DialogPanel } from '../primitives/interactive'
import Link from '../primitives/router-link'

type NavbarLinkProps = { href: string } & Omit<ComponentProps<'a'>, 'href'>
type NavbarLogoProps = { href: string } & Omit<ComponentProps<'a'>, 'href'>
type NavbarWithLinksActionsAndCenteredLogoProps = {
  links: ReactNode
  logo: ReactNode
  controls: ReactNode
  actions: ReactNode
} & ComponentProps<'header'>

export function NavbarLink(arg0: NavbarLinkProps) {
  const { children, href, className, ...props } = arg0

  return (
    <Link
      href={href}
      className={clsx(
        'group inline-flex min-h-11 items-center justify-between gap-3 rounded-(--clarify-theme-tokens-radius-md) px-3 text-base/7 font-medium text-(--clarify-ui-text-strong) transition hover:bg-(--clarify-ui-hover-background) lg:min-h-0 lg:rounded-none lg:px-0 lg:text-sm/7 lg:hover:bg-transparent',
        className,
      )}
      {...props}
    >
      {children}
      <span className="inline-flex p-1 opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100 lg:hidden" aria-hidden="true">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </span>
    </Link>
  )
}

export function NavbarLogo(arg0: NavbarLogoProps) {
  const { className, href, ...props } = arg0

  return <Link href={href} {...props} className={clsx('inline-flex items-stretch', className)} />
}

export function NavbarWithLinksActionsAndCenteredLogo(arg0: NavbarWithLinksActionsAndCenteredLogoProps) {
  const { links, logo, controls, actions, className, ...props } = arg0
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <header
        className={clsx(
          'sticky top-0 z-10 h-(--scroll-padding-top) border-b border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-background) lg:bg-(--clarify-theme-tokens-colors-background)/90 lg:backdrop-blur',
          className,
        )}
        {...props}
      >
        <style>{`:root { --scroll-padding-top: 3.5rem }`}</style>
        <nav className="h-full">
          <div className="mx-auto flex h-full max-w-7xl items-center gap-4 px-6 lg:px-10">
            <div className="flex flex-1 gap-8 max-lg:hidden">{links}</div>
            <div className="flex items-center">{logo}</div>
            <div className="flex flex-1 items-center justify-end gap-2 lg:gap-5">
              <div className="flex shrink-0 items-center gap-1 lg:gap-2">{controls}</div>
              <div className="flex shrink-0 items-center gap-5 max-lg:hidden">{actions}</div>
              <button
                type="button"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label="Open menu"
                onClick={() => setIsMobileMenuOpen(true)}
                className="inline-flex size-10 items-center justify-center rounded-full text-(--clarify-ui-text-strong) hover:bg-(--clarify-ui-hover-background) lg:hidden"
              >
                <Menu className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      <Dialog className={clsx('lg:hidden', !isMobileMenuOpen && 'hidden')}>
        <div id="mobile-menu" role="dialog" aria-modal="true">
          <DialogPanel className="fixed inset-0 z-50 flex flex-col bg-(--clarify-theme-tokens-colors-background) text-(--clarify-theme-tokens-colors-foreground)">
            <div className="flex h-(--scroll-padding-top) shrink-0 items-center justify-between border-b border-(--clarify-theme-tokens-colors-border) px-6">
              {logo}
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-full text-(--clarify-ui-text-strong) hover:bg-(--clarify-ui-hover-background)"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col px-3 py-5">
              <div onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col gap-1">
                {links}
              </div>
              <div className="mt-auto border-t border-(--clarify-theme-tokens-colors-border) px-3 pt-5" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="grid grid-cols-2 gap-3 *:min-h-12 *:text-base/7">{actions}</div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}
