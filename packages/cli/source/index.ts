export { clarifyPlugin } from './core/plugin/plugin.js'
export { ClarifyEngine, createClarifyEngine } from './core/engine/engine.js'
export { ClarifyContext } from './core/engine/context.js'
export { defineConfig } from './core/config/user-config.js'
export type { Plugin } from 'vite'
export type { ClarifyEngineRuntime, ClarifyEngineState } from './core/engine/engine.js'
export type { PhaseName, TapPhaseName, TapHook, InterceptHook, PipelineHook, CollectorHook } from './core/engine/phases.js'

export * from './types.js'
export type { ClarifyConfig } from './core/config/user-config.js'

// Re-export slot types from renderer so plugin authors can import them
// from '@clarify-labs/cli' without depending on renderer directly.
export type { UISlotName, SlotContext, UISlotRegistration } from '@clarify-labs/renderer'
