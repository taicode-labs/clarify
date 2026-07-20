import { createHash } from 'node:crypto'

import type { ClarifyEmitAsset, ClarifyPlugin } from '../../types.js'

import { createMcpSiteConfig } from './mcp-config.js'
import { buildSearchIndex, collectIndexedLocales, serializeSearchIndex } from './orama-index.js'

/**
 * MCP search index plugin.
 *
 * Generates the Orama binary index (`mcp-search.msp`) and the MCP site
 * descriptor (`mcp.json`) as build assets consumed by the `clarify mcp`
 * command to serve documentation search to MCP-aware clients (e.g. AI coding
 * assistants).
 *
 * This plugin is independent of `clarify:page-search` (Pagefind), which
 * powers in-browser search. The MCP server runs in Node and needs a
 * self-contained, compact index with CJK-aware tokenization that doesn't
 * depend on the browser-only Pagefind runtime.
 */
export function createMcpSearchPlugin(): ClarifyPlugin {
  return {
    name: 'clarify:mcp-search',
    hooks: {
      'build:assets'(ctx) {
        const searchConfig = ctx.projectConfig.features.search
        if (!searchConfig.enabled || !searchConfig.mcp) return []

        const defaultLocale = ctx.projectConfig.locales?.default
        const { db, documentCount } = buildSearchIndex(ctx.routes, defaultLocale)
        const locales = collectIndexedLocales(ctx.routes, defaultLocale)
        const indexBytes = serializeSearchIndex(db)
        const indexHash = createHash('sha256').update(indexBytes).digest('hex')
        const mcpConfig = createMcpSiteConfig(ctx.projectConfig, { documentCount, locales, indexHash })

        const prefix = mcpConfig.capabilities.search?.indexPath.replace(/\/mcp-search\.msp$/, '') ?? ''
        const assets: ClarifyEmitAsset[] = [
          {
            fileName: `${prefix}/mcp-search.msp`.replace(/^\//, ''),
            source: indexBytes,
          },
          {
            fileName: 'mcp.json',
            source: `${JSON.stringify(mcpConfig, null, 2)}\n`,
          },
        ]

        console.log(`[clarify] MCP search index (${documentCount} docs, ${locales.length} locales) written to mcp-search.msp.`)
        return assets
      },
    },
  }
}
