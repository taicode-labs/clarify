import clsx from 'clsx'

import { lucideIconRegistry, resolveLucideIconName } from '../utils/lucide'

export type NavigationIconProps = { name?: string; className?: string }

export function NavigationIcon(arg0: NavigationIconProps) {
  const { name, className } = arg0

  if (!name) return null

  const iconName = resolveLucideIconName(name)
  if (!iconName) return null

  const Icon = lucideIconRegistry[iconName]
  if (!Icon) return null

  return <Icon className={clsx('shrink-0 stroke-current', className)} aria-hidden="true" />
}
