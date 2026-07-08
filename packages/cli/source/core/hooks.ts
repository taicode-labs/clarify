import type { ViteDevServer } from 'vite'

import type { ClarifyEmitAsset, ClarifyHookContext, ClarifyHooks, ClarifyPlugin } from '../types.js'

export async function runHooks<K extends Exclude<keyof ClarifyHooks, 'build:assets' | 'build:done' | 'dev:configureServer'>>(plugins: ClarifyPlugin[], hookName: K, input: Parameters<NonNullable<ClarifyHooks[K]>>[0], ctx: ClarifyHookContext): Promise<Parameters<NonNullable<ClarifyHooks[K]>>[0]> {
  let result = input
  for (const plugin of plugins) {
    const hook = plugin.hooks?.[hookName]
    if (!hook) continue
    try {
      result = await hook(result as never, ctx) as Parameters<NonNullable<ClarifyHooks[K]>>[0]
    } catch (err) {
      throw new Error(`[clarify] plugin "${plugin.name}" hook "${hookName}" failed: ${err}`, { cause: err })
    }
  }
  return result
}

export async function runDevConfigureServerHooks(plugins: ClarifyPlugin[], server: ViteDevServer, ctx: ClarifyHookContext): Promise<void> {
  for (const plugin of plugins) {
    const hook = plugin.hooks?.['dev:configureServer']
    if (!hook) continue
    try {
      await hook(server, ctx)
    } catch (err) {
      throw new Error(`[clarify] plugin "${plugin.name}" hook "dev:configureServer" failed: ${err}`, { cause: err })
    }
  }
}

export async function runBuildAssetsHooks(plugins: ClarifyPlugin[], ctx: ClarifyHookContext): Promise<ClarifyEmitAsset[]> {
  const assets: ClarifyEmitAsset[] = []
  for (const plugin of plugins) {
    const hook = plugin.hooks?.['build:assets']
    if (!hook) continue
    try {
      const pluginAssets = await hook(ctx)
      assets.push(...pluginAssets)
    } catch (err) {
      throw new Error(`[clarify] plugin "${plugin.name}" hook "build:assets" failed: ${err}`, { cause: err })
    }
  }
  return assets
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
