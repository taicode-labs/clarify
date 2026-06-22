import { createContentArtifactsPlugin } from '../plugins/content-artifacts/index.js'
import { createHtmlShellPlugin } from '../plugins/html-shell/index.js'
import { createOpenAPIPlugin } from '../plugins/openapi/index.js'
import { createSeoPlugin } from '../plugins/seo/index.js'
import { createSourceLinksPlugin } from '../plugins/source-links/index.js'
import type { ClarifyPlugin } from '../types.js'

export type BuiltinPluginOptions = {
  htmlShell?: boolean
}

export function createBuiltinPlugins(options: BuiltinPluginOptions = {}): ClarifyPlugin[] {
  const plugins = [createOpenAPIPlugin(), createSourceLinksPlugin(), createContentArtifactsPlugin(), createSeoPlugin()]
  if (options.htmlShell ?? true) plugins.push(createHtmlShellPlugin())
  return plugins
}
