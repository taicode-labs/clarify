import clsx from 'clsx'
import * as LucideIcons from 'lucide-react'

type LucideIconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>

export function NavigationIcon(arg0: { name?: string; className?: string }) {  const { name, className } = arg0

  if (!name) return null
  const Icon = (LucideIcons as unknown as Record<string, LucideIconComponent>)[name]

  if (!Icon) return null

  return <Icon className={clsx('shrink-0 stroke-current', className)} aria-hidden="true" />
}
