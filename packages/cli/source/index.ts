export { clarifyPlugin } from './core/plugin/plugin.js'
export { defineConfig } from './core/config/user-config.js'
export type { Plugin } from 'vite'

export * from './types.js'
export type { ClarifyConfig } from './core/config/user-config.js'

// Re-export slot types from renderer so plugin authors can import them
// from '@clarify-labs/cli' without depending on renderer directly.
export type { UISlotName, SlotContext, UISlotRegistration } from '@clarify-labs/renderer'
