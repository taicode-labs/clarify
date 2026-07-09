import { createContentArtifactsPlugin } from '../../plugins/content-artifacts/index.js'
import { createHtmlShellPlugin } from '../../plugins/html-shell/index.js'
import { createNavigationPlugin } from '../../plugins/navigation/index.js'
import { createOpenAPIPlugin } from '../../plugins/openapi/index.js'
import { createSearchIndexPlugin } from '../../plugins/search-index/index.js'
import { createSeoPlugin } from '../../plugins/seo/index.js'
import { createSiteDiscoveryPlugin } from '../../plugins/site-discovery/index.js'
import { createSourceLinksPlugin } from '../../plugins/source-links/index.js'
import { createVariablesPlugin } from '../../plugins/variables/index.js'
import type { ClarifyPlugin } from '../../types.js'

export type BuiltinPluginOptions = {
  htmlShell?: boolean
}

export function createBuiltinPlugins(options: BuiltinPluginOptions = {}): ClarifyPlugin[] {
  // site-discovery runs as enforce:'pre' so the routes:discover pipeline
  // produces the initial route set before other plugins augment it.
  // navigation runs as enforce:'post' so applyConfiguredPageRoutePaths and
  // navigation building happen after other plugins have filtered/augmented routes.
  const plugins = [
    createSiteDiscoveryPlugin(),
    createVariablesPlugin(),
    createOpenAPIPlugin(),
    createSourceLinksPlugin(),
    createContentArtifactsPlugin(),
    createSeoPlugin(),
    createSearchIndexPlugin(),
    createNavigationPlugin(),
  ]
  if (options.htmlShell ?? true) plugins.push(createHtmlShellPlugin())
  return plugins
}
