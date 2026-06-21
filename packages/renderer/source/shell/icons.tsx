import clsx from 'clsx'

import { lucideIconRegistry, resolveLucideIconName } from '../utils/lucide'

export function NavigationIcon(arg0: { name?: string; className?: string }) {
  const { name, className } = arg0

  if (!name) return null

  const iconName = resolveLucideIconName(name)
  if (!iconName) return null

  const Icon = lucideIconRegistry[iconName]
  if (!Icon) return null

  return <Icon className={clsx('shrink-0 stroke-current', className)} aria-hidden="true" />
}
