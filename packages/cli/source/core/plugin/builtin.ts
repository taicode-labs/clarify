import { createContentArtifactsPlugin } from '../../plugins/content-artifacts/index.js'
import { createHtmlShellPlugin } from '../../plugins/html-shell/index.js'
import { createMcpSearchPlugin } from '../../plugins/mcp-search/index.js'
import { createOpenAPIPlugin } from '../../plugins/openapi/index.js'
import { createPageSearchPlugin } from '../../plugins/page-search/index.js'
import { createSeoPlugin } from '../../plugins/seo/index.js'
import { createSourceLinksPlugin } from '../../plugins/source-links/index.js'
import { createVariablesPlugin } from '../../plugins/variables/index.js'
import type { ClarifyPlugin } from '../../types.js'

export type BuiltinPluginOptions = {
  htmlShell?: boolean
}

export function createBuiltinPlugins(options: BuiltinPluginOptions = {}): ClarifyPlugin[] {
  // Core site discovery (content scanning, i18n fallback routes) and
  // navigation building are handled directly by the Engine, not as plugins.
  // The remaining plugins provide optional functionality (variables, OpenAPI,
  // SEO, search, etc.) and can be augmented or replaced by user plugins.
  const plugins = [
    createVariablesPlugin(),
    createOpenAPIPlugin(),
    createSourceLinksPlugin(),
    createContentArtifactsPlugin(),
    createSeoPlugin(),
    createPageSearchPlugin(),
    createMcpSearchPlugin(),
  ]
  if (options.htmlShell ?? true) plugins.push(createHtmlShellPlugin())
  return plugins
}
