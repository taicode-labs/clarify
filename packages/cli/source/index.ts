export { clarifyPlugin } from './core/plugin.js'
export { defineConfig } from './core/user-config.js'
export type { Plugin } from 'vite'

export * from './types.js'
export type { ClarifyConfig } from './core/user-config.js'

// Re-export React types for use in virtual modules
export type { ComponentType } from 'react'
