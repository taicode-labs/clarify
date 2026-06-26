import type { ComponentType } from 'react'

import type { RouteItem } from '../core/types'

// ────────────────────────────────────────────────────────────────────────────────
// Runtime UI slot types
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Stable runtime UI slot positions.
 *
 * The name is a dot-path `${scope}.${path}.${position}`:
 * - `*.before`: Extension slot, plugin components render before default
 * - `*.after`: Extension slot, plugin components render after default
 * - `*.replace`: Replacement slot, plugin component replaces default
 */
export type UISlotName =
  | 'page.footer.before'
  | 'page.banner.replace'
  | 'page.footer.replace'

/**
 * Context exposed to a slot component through the `useSlot` hook.
 *
 * Slot components never receive Clarify context through props. Instead they read
 * everything they need from this hook, which keeps slot components as ordinary
 * React components and lets the slot context grow without changing signatures.
 */
export type SlotContext = {
  /** The slot the current component is mounted into. */
  name: UISlotName
  /** Name of the plugin that registered the current slot component. */
  plugin: string
  /** Current route, when a content route is active. */
  route?: RouteItem
  /** Current locale, for example `zh-CN` or `en-US`. */
  locale?: string
  /** Built-in default component for replacement slots. */
  DefaultComponent?: ComponentType
}

/**
 * A runtime UI extension declared by a plugin. The CLI compiles every
 * registration into `virtual:clarify/slots`.
 */
export type UISlotRegistration = {
  /** Target slot position. */
  name: UISlotName
  /**
   * Module path of the React component to mount. Can be a real module
   * (resolvable from the project) or a virtual module the plugin injects via
   * `modules:before`. The component is imported as a default export.
   */
  component: string
}
