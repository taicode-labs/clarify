import type { ClarifyPlugin } from '../../types.js'
import type { ClarifyBuildOptions } from '../config/options.js'
import type { ClarifyContext } from '../engine/context.js'
import { runPhase } from '../engine/phases.js'

import { createBuiltinPlugins, type BuiltinPluginOptions } from './builtin.js'

export type LoadPluginsOptions = BuiltinPluginOptions & {
  userPlugins?: ClarifyPlugin[]
}

function pluginWeight(plugin: ClarifyPlugin): number {
  const enforceWeight = plugin.enforce === 'pre'
    ? 1_000_000
    : plugin.enforce === 'post'
      ? -1_000_000
      : 0
  return enforceWeight + (plugin.priority ?? 0)
}

export function sortPlugins(plugins: ClarifyPlugin[]): ClarifyPlugin[] {
  const entries = plugins.map((plugin, index) => ({ plugin, index }))
  const byName = new Map<string, ClarifyPlugin>()
  for (const { plugin } of entries) {
    if (byName.has(plugin.name)) throw new Error(`[clarify] Duplicate plugin name: ${plugin.name}`)
    byName.set(plugin.name, plugin)
  }

  const sortedByWeight = [...entries].sort((left, right) => {
    const weightDiff = pluginWeight(right.plugin) - pluginWeight(left.plugin)
    return weightDiff === 0 ? left.index - right.index : weightDiff
  })
  const visitOrder = new Map(sortedByWeight.map((entry, index) => [entry.plugin.name, index]))
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const sorted: ClarifyPlugin[] = []

  function visit(plugin: ClarifyPlugin): void {
    if (visited.has(plugin.name)) return
    if (visiting.has(plugin.name)) throw new Error(`[clarify] Circular plugin dependency detected: ${plugin.name}`)

    visiting.add(plugin.name)
    const dependencies = [...(plugin.dependsOn ?? [])].sort((left, right) => (visitOrder.get(left) ?? 0) - (visitOrder.get(right) ?? 0))
    for (const dependencyName of dependencies) {
      const dependency = byName.get(dependencyName)
      if (!dependency) throw new Error(`[clarify] Plugin ${plugin.name} depends on missing plugin: ${dependencyName}`)
      visit(dependency)
    }
    visiting.delete(plugin.name)
    visited.add(plugin.name)
    sorted.push(plugin)
  }

  for (const { plugin } of sortedByWeight) visit(plugin)
  return sorted
}

export function loadPlugins(options: LoadPluginsOptions = {}): ClarifyPlugin[] {
  return sortPlugins([
    ...createBuiltinPlugins({ htmlShell: options.htmlShell }),
    ...(options.userPlugins ?? []),
  ])
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
