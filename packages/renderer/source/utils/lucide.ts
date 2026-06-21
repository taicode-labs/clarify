import * as LucideIcons from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

export type LucideIconComponent = ComponentType<SVGProps<SVGSVGElement>>

/**
 * Registry of all Lucide icon components keyed by their PascalCase export name.
 *
 * Access icons via index lookup (e.g. `lucideIconRegistry[name]`) so React
 * tooling does not mistake the access for a component created during render.
 */
export const lucideIconRegistry = LucideIcons as unknown as Record<string, LucideIconComponent | undefined>

function toPascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')
}

/**
 * Resolve an icon name into the matching Lucide registry key.
 *
 * Accepts both the exact PascalCase export name (e.g. `ArrowRight`) and
 * kebab/space/snake variants (e.g. `arrow-right`), returning `undefined`
 * when no matching icon exists.
 */
export function resolveLucideIconName(name: string | undefined): string | undefined {
  if (!name) return undefined
  if (lucideIconRegistry[name]) return name
  const pascalName = toPascalCase(name)
  return lucideIconRegistry[pascalName] ? pascalName : undefined
}
