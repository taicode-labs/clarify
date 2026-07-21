import type { ViteDevServer } from 'vite'

import type { ClarifyDevServerPostHook, ClarifyEmitAsset, ClarifyHookContext, ClarifyPipelineHooks, ClarifyPlugin } from '../../types.js'

export async function runHooks<K extends keyof ClarifyPipelineHooks>(plugins: ClarifyPlugin[], hookName: K, input: Parameters<NonNullable<ClarifyPipelineHooks[K]>>[0], ctx: ClarifyHookContext): Promise<Parameters<NonNullable<ClarifyPipelineHooks[K]>>[0]> {
  let result = input
  for (const plugin of plugins) {
    const hook = plugin.hooks?.[hookName]
    if (!hook) continue
    try {
      result = await hook(result as never, ctx) as Parameters<NonNullable<ClarifyPipelineHooks[K]>>[0]
    } catch (err) {
      throw new Error(`[clarify] plugin "${plugin.name}" hook "${hookName}" failed: ${err}`, { cause: err })
    }
  }
  return result
}

export async function runDevConfigureServerHooks(plugins: ClarifyPlugin[], server: ViteDevServer, ctx: ClarifyHookContext): Promise<ClarifyDevServerPostHook[]> {
  const postHooks: ClarifyDevServerPostHook[] = []
  for (const plugin of plugins) {
    const hook = plugin.hooks?.['dev:configureServer']
    if (!hook) continue
    try {
      const postHook = await hook(server, ctx)
      if (postHook) postHooks.push(postHook)
    } catch (err) {
      throw new Error(`[clarify] plugin "${plugin.name}" hook "dev:configureServer" failed: ${err}`, { cause: err })
    }
  }
  return postHooks
}

async function runCollectorHooks<T>(plugins: ClarifyPlugin[], hookName: string, ctx: ClarifyHookContext): Promise<T[]> {
  const results: T[] = []
  for (const plugin of plugins) {
    const hook = plugin.hooks?.[hookName as 'build:assets']
    if (!hook) continue
    try {
      const pluginResults = await (hook as (ctx: ClarifyHookContext) => Promise<T[]> | T[])(ctx)
      results.push(...pluginResults)
    } catch (err) {
      throw new Error(`[clarify] plugin "${plugin.name}" hook "${hookName}" failed: ${err}`, { cause: err })
    }
  }
  return results
}

export async function runBuildAssetsHooks(plugins: ClarifyPlugin[], ctx: ClarifyHookContext): Promise<ClarifyEmitAsset[]> {
  return runCollectorHooks<ClarifyEmitAsset>(plugins, 'build:assets', ctx)
}

export async function runBuildDoneHooks(plugins: ClarifyPlugin[], ctx: ClarifyHookContext): Promise<void> {
  for (const plugin of plugins) {
    const hook = plugin.hooks?.['build:done']
    if (!hook) continue
    try {
      await hook(ctx)
    } catch (err) {
      throw new Error(`[clarify] plugin "${plugin.name}" hook "build:done" failed: ${err}`, { cause: err })
    }
  }
}
