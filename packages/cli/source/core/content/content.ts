import { createContentProcessor, type ContentProcessor } from '../../parsers/content/content.js'
import type { ClarifyHookContext, ClarifyPlugin } from '../../types.js'

import { runHooks } from '../plugin/hooks.js'

const contentProcessors = new WeakMap<ClarifyHookContext, ContentProcessor>()

export function createProjectContentProcessor(plugins: ClarifyPlugin[], ctx: ClarifyHookContext): ContentProcessor {
  return createContentProcessor(input => runHooks(plugins, 'content:transform', input, ctx))
}

export function setProjectContentProcessor(ctx: ClarifyHookContext, processor: ContentProcessor): void {
  contentProcessors.set(ctx, processor)
}

export function getProjectContentProcessor(ctx: ClarifyHookContext): ContentProcessor | undefined {
  return contentProcessors.get(ctx)
}
