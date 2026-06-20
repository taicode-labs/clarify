
import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

import Link from '../primitives/router-link'

const sizes = {
  md: 'px-3 py-1',
  lg: 'px-4 py-2',
}

const solidButtonStyles = {
  'dark/light':
    'bg-(--clarify-theme-tokens-colors-foreground) text-(--clarify-theme-tokens-colors-background) hover:opacity-85 dark:bg-white dark:text-zinc-950',
  light: 'bg-white text-zinc-950 hover:bg-zinc-100 dark:bg-zinc-100 dark:hover:bg-white',
}

const plainButtonStyles = {
  'dark/light': 'text-(--clarify-ui-text-strong) hover:bg-(--clarify-ui-hover-background)',
  light: 'text-white hover:bg-white/15 dark:hover:bg-white/10',
}

const softButtonStyles =
  'inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-(--clarify-ui-hover-background) text-sm/7 font-medium text-(--clarify-ui-text-strong) transition hover:bg-(--clarify-ui-active-background)'

export function Button(arg0: {
  size?: keyof typeof sizes
  color?: 'dark/light' | 'light'
} & ComponentProps<'button'>) {  const {
  size = 'md',
  type = 'button',
  color = 'dark/light',
  className,
  ...props
} = arg0

  return (
    <button
      type={type}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center gap-1 rounded-full text-sm/7 font-medium transition',
        solidButtonStyles[color],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}

export function ButtonLink(arg0: {
  href: string
  size?: keyof typeof sizes
  color?: 'dark/light' | 'light'
} & Omit<ComponentProps<'a'>, 'href'>) {  const {
  size = 'md',
  color = 'dark/light',
  className,
  href,
  ...props
} = arg0

  return (
    <Link
      href={href}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center gap-1 rounded-full text-sm/7 font-medium transition',
        solidButtonStyles[color],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}

export function SoftButton(arg0: {
  size?: keyof typeof sizes
} & ComponentProps<'button'>) {  const {
  size = 'md',
  type = 'button',
  className,
  ...props
} = arg0

  return <button type={type} className={clsx(softButtonStyles, sizes[size], className)} {...props} />
}

export function SoftButtonLink(arg0: {
  href: string
  size?: keyof typeof sizes
} & Omit<ComponentProps<'a'>, 'href'>) {  const {
  size = 'md',
  href,
  className,
  ...props
} = arg0

  return <Link href={href} className={clsx(softButtonStyles, sizes[size], className)} {...props} />
}

export function PlainButton(arg0: {
  size?: keyof typeof sizes
  color?: 'dark/light' | 'light'
} & ComponentProps<'button'>) {  const {
  size = 'md',
  color = 'dark/light',
  type = 'button',
  className,
  ...props
} = arg0

  return (
    <button
      type={type}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm/7 font-medium transition',
        plainButtonStyles[color],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}

export function PlainButtonLink(arg0: {
  href: string
  size?: keyof typeof sizes
  color?: 'dark/light' | 'light'
} & Omit<ComponentProps<'a'>, 'href'>) {  const {
  size = 'md',
  color = 'dark/light',
  href,
  className,
  ...props
} = arg0

  return (
    <Link
      href={href}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm/7 font-medium transition',
        plainButtonStyles[color],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
