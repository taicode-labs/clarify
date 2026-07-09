import type { ClarifyPlugin } from '../../types.js'
import type { ClarifyBuildOptions } from '../config/options.js'
import type { ClarifyContext } from '../engine/context.js'
import { runPhase } from '../engine/phases.js'

import { createBuiltinPlugins, type BuiltinPluginOptions } from './builtin.js'

export type LoadPluginsOptions = BuiltinPluginOptions & {
  userPlugins?: ClarifyPlugin[]
}

export function loadPlugins(options: LoadPluginsOptions = {}): ClarifyPlugin[] {
  return [
    ...createBuiltinPlugins({ htmlShell: options.htmlShell }),
    ...(options.userPlugins ?? []),
  ]
}

export function loadBuildPlugins(options: ClarifyBuildOptions = {}, pluginOptions: BuiltinPluginOptions = {}): ClarifyPlugin[] {
  return loadPlugins({
    ...pluginOptions,
    userPlugins: options.plugins,
  })
}

export async function loadBuildPluginsForContext(ctx: ClarifyContext, options: ClarifyBuildOptions = {}, pluginOptions: BuiltinPluginOptions = {}): Promise<ClarifyPlugin[]> {
  const seedPlugins = loadBuildPlugins(options, pluginOptions)
  ctx.plugins = seedPlugins
  await runPhase(seedPlugins, 'plugins:load', ctx, () => undefined)
  return ctx.plugins
}
