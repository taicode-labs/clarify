import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'

import { Container } from '../elements/container'
import { ArrowNarrowRightIcon } from '../icons/arrow-narrow-right-icon'
import Link from '../primitives/router-link'

export function FooterCategory({ title, children, ...props }: { title: ReactNode } & ComponentProps<'div'>) {
  return (
    <div {...props}>
      <h3>{title}</h3>
      <ul role="list" className="mt-2 flex flex-col gap-2">
        {children}
      </ul>
    </div>
  )
}

export function FooterLink({ href, className, ...props }: { href: string } & Omit<ComponentProps<'a'>, 'href'>) {
  return (
    <li className={clsx('text-(--clarify-ui-text-soft)', className)}>
      <Link href={href} {...props} />
    </li>
  )
}

export function SocialLink({
  href,
  name,
  className,
  ...props
}: {
  href: string
  name: string
} & Omit<ComponentProps<'a'>, 'href'>) {
  return (
    <Link
      href={href}
      target="_blank"
      aria-label={name}
      className={clsx('text-(--clarify-ui-text-strong) *:size-6', className)}
      {...props}
    />
  )
}

export function NewsletterForm({
  headline,
  subheadline,
  emailLabel = 'Email',
  subscribeLabel = 'Subscribe',
  className,
  ...props
}: {
  headline: ReactNode
  subheadline: ReactNode
  emailLabel?: string
  subscribeLabel?: string
} & ComponentProps<'form'>) {
  return (
    <form className={clsx('flex max-w-sm flex-col gap-2', className)} {...props}>
      <p>{headline}</p>
      <div className="flex flex-col gap-4 text-(--clarify-ui-text-soft)">{subheadline}</div>
      <div className="flex items-center border-b border-(--clarify-theme-tokens-colors-border) py-2 has-[input:focus]:border-(--clarify-ui-text-strong)">
        <input
          type="email"
          placeholder={emailLabel}
          aria-label={emailLabel}
          className="flex-1 text-(--clarify-ui-text-strong) placeholder:text-(--clarify-ui-text-faint) focus:outline-hidden"
        />
        <button
          type="submit"
          aria-label={subscribeLabel}
          className="relative inline-flex size-7 items-center justify-center rounded-full hover:bg-(--clarify-ui-hover-background) after:absolute after:-inset-2 after:pointer-fine:hidden"
        >
          <ArrowNarrowRightIcon />
        </button>
      </div>
    </form>
  )
}

export function FooterWithNewsletterFormCategoriesAndSocialIcons({
  cta,
  links,
  fineprint,
  socialLinks,
  className,
  ...props
}: {
  cta: ReactNode
  links: ReactNode
  fineprint: ReactNode
  socialLinks?: ReactNode
} & ComponentProps<'footer'>) {
  return (
    <footer className={clsx('pt-16', className)} {...props}>
      <div className="bg-(--clarify-ui-subtle-background) py-16 text-(--clarify-ui-text-strong)">
        <Container className="flex flex-col gap-16">
          <div className="grid grid-cols-1 gap-x-6 gap-y-16 text-sm/7 lg:grid-cols-2">
            {cta}
            <nav className="grid grid-cols-2 gap-6 sm:has-[>:last-child:nth-child(3)]:grid-cols-3 sm:has-[>:nth-child(5)]:grid-cols-3 md:has-[>:last-child:nth-child(4)]:grid-cols-4 lg:max-xl:has-[>:last-child:nth-child(4)]:grid-cols-2">
              {links}
            </nav>
          </div>
          <div className="flex items-center justify-between gap-10 text-sm/7">
            <div className="text-(--clarify-ui-text-faint)">{fineprint}</div>
            {socialLinks && <div className="flex items-center gap-4 sm:gap-10">{socialLinks}</div>}
          </div>
        </Container>
      </div>
    </footer>
  )
}
