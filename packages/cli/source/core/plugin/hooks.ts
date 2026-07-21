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

export async function runBuildAssetsHooks(plugins: ClarifyPlugin[], ctx: ClarifyHookContext): Promise<ClarifyEmitAsset[]> {
  const assets: ClarifyEmitAsset[] = []
  const producerByFileName = new Map<string, string>()

  for (const plugin of plugins) {
    const hook = plugin.hooks?.['build:assets']
    if (!hook) continue

    let pluginAssets: ClarifyEmitAsset[]
    try {
      pluginAssets = await hook(ctx)
    } catch (err) {
      throw new Error(`[clarify] plugin "${plugin.name}" hook "build:assets" failed: ${err}`, { cause: err })
    }

    for (const asset of pluginAssets) {
      const fileName = asset.fileName.replace(/\\/g, '/').replace(/^\/+/, '')
      const previousProducer = producerByFileName.get(fileName)
      if (previousProducer) {
        throw new Error(`[clarify] build asset "${fileName}" is emitted by both plugin "${previousProducer}" and plugin "${plugin.name}"`)
      }
      producerByFileName.set(fileName, plugin.name)
      assets.push({ ...asset, fileName })
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
