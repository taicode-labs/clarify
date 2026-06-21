import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

import { Wallpaper } from './wallpaper'

export function Screenshot(arg0: {
  wallpaper: 'green' | 'blue' | 'purple' | 'brown'
  placement: 'bottom' | 'bottom-left' | 'bottom-right' | 'top' | 'top-left' | 'top-right'
} & Omit<ComponentProps<'div'>, 'color'>) {  const {
  children,
  wallpaper,
  placement,
  className,
  ...props
} = arg0

  return (
    <Wallpaper color={wallpaper} data-placement={placement} className={clsx('group', className)} {...props}>
      <div className="relative h-full [--padding:min(10%,--spacing(16))] group-data-[placement=bottom]:px-(--padding) group-data-[placement=bottom]:pt-(--padding) group-data-[placement=bottom-left]:pt-(--padding) group-data-[placement=bottom-left]:pr-(--padding) group-data-[placement=bottom-right]:pt-(--padding) group-data-[placement=bottom-right]:pl-(--padding) group-data-[placement=top]:px-(--padding) group-data-[placement=top]:pb-(--padding) group-data-[placement=top-left]:pr-(--padding) group-data-[placement=top-left]:pb-(--padding) group-data-[placement=top-right]:pb-(--padding) group-data-[placement=top-right]:pl-(--padding)">
        <div className="h-full *:relative *:ring-1 *:ring-(--clarify-theme-tokens-colors-border) group-data-[placement=bottom]:*:rounded-t-sm group-data-[placement=bottom-left]:*:rounded-tr-sm group-data-[placement=bottom-right]:*:rounded-tl-sm group-data-[placement=top]:*:rounded-b-sm group-data-[placement=top-left]:*:rounded-br-sm group-data-[placement=top-right]:*:rounded-bl-sm">
          {children}
        </div>
      </div>
    </Wallpaper>
  )
}
