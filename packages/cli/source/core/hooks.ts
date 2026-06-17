import type { ClarifyHookContext, ClarifyHooks, ClarifyPlugin } from '../types.js'

export async function runHooks<K extends Exclude<keyof ClarifyHooks, 'build:done'>>(plugins: ClarifyPlugin[], hookName: K, input: Parameters<NonNullable<ClarifyHooks[K]>>[0], ctx: ClarifyHookContext): Promise<Parameters<NonNullable<ClarifyHooks[K]>>[0]> {
  let result = input
  for (const plugin of plugins) {
    const hook = plugin.hooks[hookName]
    if (!hook) continue
    try {
      result = await hook(result as never, ctx) as Parameters<NonNullable<ClarifyHooks[K]>>[0]
    } catch (err) {
      throw new Error(`[clarify] plugin "${plugin.name}" hook "${hookName}" failed: ${err}`, { cause: err })
    }
  }
  return result
}

export async function runBuildDoneHooks(plugins: ClarifyPlugin[], ctx: ClarifyHookContext): Promise<void> {
  for (const plugin of plugins) {
    const hook = plugin.hooks['build:done']
    if (!hook) continue
    try {
      await hook(ctx)
    } catch (err) {
      throw new Error(`[clarify] plugin "${plugin.name}" hook "build:done" failed: ${err}`, { cause: err })
    }
  }
}
