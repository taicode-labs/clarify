import type { ClarifyHookContext, ClarifyPlugin } from '../../types.js'

export type PhaseName =
  | 'config:load'
  | 'config:resolve'
  | 'plugins:load'
  | 'site:discover'
  | 'content:process'
  | 'modules:build'
  | 'build'
  | 'ssg'
  | 'dev:server'

export type TapPhaseName =
  | `before:${PhaseName}`
  | `after:${PhaseName}`

export type TapHook = (ctx: ClarifyHookContext) => Promise<void> | void
export type InterceptHook = (ctx: ClarifyHookContext) => Promise<boolean> | boolean
export type PipelineHook<Input> = (input: Input, ctx: ClarifyHookContext) => Promise<Input> | Input
export type CollectorHook<Result> = (ctx: ClarifyHookContext) => Promise<Result> | Result

export async function runTapHooks(plugins: ClarifyPlugin[], hookName: TapPhaseName, ctx: ClarifyHookContext): Promise<void> {
  for (const plugin of plugins) {
    const hook = plugin.hooks?.[hookName]
    if (!hook) continue
    try {
      await hook(ctx)
    } catch (err) {
      throw new Error(`[clarify] plugin "${plugin.name}" hook "${hookName}" failed: ${err}`, { cause: err })
    }
  }
}

export async function runInterceptHooks(plugins: ClarifyPlugin[], hookName: 'build:shouldRun' | 'ssg:shouldRun', ctx: ClarifyHookContext): Promise<boolean> {
  for (const plugin of plugins) {
    const hook = plugin.hooks?.[hookName]
    if (!hook) continue
    try {
      if (await hook(ctx) === false) return false
    } catch (err) {
      throw new Error(`[clarify] plugin "${plugin.name}" hook "${hookName}" failed: ${err}`, { cause: err })
    }
  }
  return true
}

export async function runPhase<T>(plugins: ClarifyPlugin[], phase: PhaseName, ctx: ClarifyHookContext, task: () => Promise<T> | T): Promise<T> {
  await runTapHooks(plugins, `before:${phase}`, ctx)
  const result = await task()
  await runTapHooks(plugins, `after:${phase}`, ctx)
  return result
}
