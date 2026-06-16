import type { ClarifyHooks, ClarifyPlugin, ClarifyHookContext } from './types.js';

export async function runHooks<K extends keyof ClarifyHooks>(plugins: ClarifyPlugin[], hookName: K, input: Parameters<NonNullable<ClarifyHooks[K]>>[0], ctx: ClarifyHookContext): Promise<Parameters<NonNullable<ClarifyHooks[K]>>[0]> {
  let result = input;
  for (const plugin of plugins) {
    const hook = plugin.hooks[hookName] as any;
    if (!hook) continue;
    try {
      result = await hook(result, ctx);
    } catch (err) {
      throw new Error(`[clarify] plugin "${plugin.name}" hook "${hookName}" failed: ${err}`, { cause: err });
    }
  }
  return result;
}
