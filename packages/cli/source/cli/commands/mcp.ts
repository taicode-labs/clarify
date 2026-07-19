import type { McpSiteConfig } from '../../plugins/mcp-search/mcp-config.js'
import { loadSearchIndex } from '../mcp/orama-loader.js'
import type { LoadedMcpSite } from '../mcp/search-server.js'
import { runMcpSearchServer } from '../mcp/search-server.js'

export type McpCliOptions = {
  /** Skip the on-disk index cache; always fetch fresh. */
  noCache?: boolean
  /** Optional logger for diagnostics (defaults to stderr). */
  log?: (message: string) => void
}

/**
 * Start a local MCP server (stdio transport) that exposes full-text search
 * over one or more deployed Clarify sites' Orama indices.
 *
 * For each site:
 *   1. Fetch `<site>/mcp.json` to learn the index path, default locale, and
 *      document count. This is a tiny file and avoids hardcoding any
 *      assumptions about where the index lives on the site.
 *   2. Use the descriptor to fetch the binary `.msp` index (cached locally
 *      keyed by site origin + document count + locale fingerprint) and
 *      deserialize it into an in-memory Orama db with the correct tokenizer.
 *
 * Then register the `search_docs` tool, which searches across all loaded
 * sites and merges results (each hit annotated with its source site), and
 * serve over stdio.
 *
 * All logs go to stderr - stdout is reserved for the JSON-RPC protocol.
 */
export async function runMcp(siteUrls: string[], options: McpCliOptions = {}): Promise<void> {
  if (siteUrls.length === 0) {
    throw new Error('[clarify] At least one site URL is required. Usage: clarify mcp <site> [site...]')
  }

  const log = options.log ?? stderrLog
  const sites: LoadedMcpSite[] = []
  for (const siteUrl of siteUrls) {
    const config = await fetchMcpConfig(siteUrl, fetch, log)
    const search = config.capabilities.search
    if (!search) {
      throw new Error(`[clarify] mcp.json for ${siteUrl} has no search capability. Run a build with search enabled.`)
    }
    log(`Loaded mcp.json for ${siteUrl}: ${search.documentCount} doc(s), ${search.locales.length} locale(s)`)

    const index = await loadSearchIndex(siteUrl, config, {
      noCache: options.noCache,
      fetchImpl: fetch,
      log,
    })
    sites.push({ siteUrl, config, index })
  }

  await runMcpSearchServer(sites, { log })
}

function stderrLog(message: string): void {
  process.stderr.write(`[clarify] ${message}\n`)
}

export async function fetchMcpConfig(siteUrl: string, fetchImpl: typeof fetch, log: (m: string) => void): Promise<McpSiteConfig> {
  const configUrl = new URL('mcp.json', new URL(siteUrl).href).href
  log(`Fetching ${configUrl}`)
  const res = await fetchImpl(configUrl, { redirect: 'follow' })
  if (!res.ok) {
    throw new Error(
      `[clarify] Failed to fetch mcp.json from ${configUrl} (HTTP ${res.status}). ` +
        'Ensure the site was built with a recent version of Clarify that emits mcp.json.',
    )
  }
  const config = (await res.json()) as McpSiteConfig
  if (config.version !== 3) {
    throw new Error(`[clarify] Unsupported mcp.json schema version ${config.version}. Please update the clarify CLI.`)
  }
  const search = config.capabilities.search
  if (!search || search.documentCount === 0) {
    throw new Error(`[clarify] mcp.json at ${configUrl} has no indexed documents. Run a build with search enabled.`)
  }
  if (!search.indexPath) {
    throw new Error(`[clarify] mcp.json at ${configUrl} is missing capabilities.search.indexPath.`)
  }
  return config
}
