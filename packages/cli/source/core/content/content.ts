import { createContentProcessor, type ContentProcessor } from '../../parsers/content/content.js'
import type { ClarifyHookContext, ClarifyPlugin } from '../../types.js'
import { runHooks } from '../plugin/hooks.js'

/**
 * Creates a ContentProcessor that forwards each piece of content through the
 * `content:transform` pipeline hook before it is parsed.
 *
 * Plugins that need to read content (site-discovery, openapi) call this with
 * the plugins list from their hook context. There is no global registry -
 * each call produces an independent processor bound to the given plugins.
 */
export function createProjectContentProcessor(plugins: ClarifyPlugin[], ctx: ClarifyHookContext): ContentProcessor {
  return createContentProcessor(input => runHooks(plugins, 'content:transform', input, ctx))
}
