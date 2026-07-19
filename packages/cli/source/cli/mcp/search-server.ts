import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

import type { McpSiteConfig } from '../../plugins/mcp-search/mcp-config.js'
import type { McpSearchHit } from '../../plugins/mcp-search/orama-index.js'

import type { LoadedSearchIndex } from './orama-loader.js'

export type SearchServerOptions = {
  /** Optional logger routed to stderr (stdout is the JSON-RPC channel). */
  log?: (message: string) => void
}

/**
 * A site loaded for the MCP server: its descriptor, ready-to-search index,
 * and the origin URL the index was fetched from (used to resolve relative
 * result paths and to label results by source site).
 */
export type LoadedMcpSite = {
  siteUrl: string
  config: McpSiteConfig
  index: LoadedSearchIndex
}

/** A search hit annotated with the site it came from. */
type SourcedHit = McpSearchHit & { site: string }

/**
 * Build the MCP server exposing site search over one or more Clarify sites.
 *
 * Tools registered:
 *   - `search_docs`: full-text search across all loaded sites, with each
 *     result annotated by its source site.
 *
 * Results are serialized to a compact, LLM-friendly shape: title, URL, site,
 * excerpt, score, and locale. Full page content is intentionally omitted to
 * keep responses within token budgets; clients can fetch the URL themselves.
 */
export function createMcpSearchServer(sites: LoadedMcpSite[], options: SearchServerOptions = {}): McpServer {
  const log = options.log ?? (() => {})
  const server = new McpServer({
    name: 'clarify-search',
    version: '1.0.0',
  })

  if (sites.length === 0) {
    throw new Error('[clarify] createMcpSearchServer requires at least one loaded site.')
  }

  // Aggregate metadata across all loaded sites for the tool description.
  const totalDocs = sites.reduce((sum, site) => sum + (site.config.capabilities.search?.documentCount ?? 0), 0)
  const localeSet = new Set<string>()
  for (const site of sites) {
    for (const locale of site.config.capabilities.search?.locales ?? []) localeSet.add(locale)
  }
  const localeList = [...localeSet]
  const siteTitles = sites
    .map(site => site.config.site.title ?? 'site')
    .filter((title, i, arr) => arr.indexOf(title) === i)
  const siteHint = siteTitles.length === 1
    ? `"${siteTitles[0]}"`
    : `${sites.length} sites (${siteTitles.join(', ')})`

  const localeHint = localeList.length > 0
    ? ` Available locales: ${localeList.join(', ')}.`
    : ''
  const defaultLocale = sites[0].config.capabilities.search?.defaultLocale
  const defaultLocaleHint = defaultLocale
    ? ` Defaults to "${defaultLocale}".`
    : ''

  server.registerTool(
    'search_docs',
    {
      title: 'Search documentation',
      description: [
        `Full-text search over ${siteHint} documentation index.`,
        `Returns ranked results with excerpts, URLs, and source site. The index contains ${totalDocs} pages across ${localeList.length} locale(s).`,
        localeHint,
        defaultLocaleHint,
        'Pass a `locale` filter to restrict results to a specific language.',
      ].filter(Boolean).join(' '),
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe('Search query. CJK text is word-segmented automatically; Latin text is split on whitespace/punctuation.'),
        locale: z
          .string()
          .optional()
          .describe(`Filter results to a single locale. One of: ${localeList.join(', ')}.`),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe('Maximum results to return. Default 10, max 50.'),
      },
    },
    async ({ query, locale, limit }) => {
      log(`search_docs query=${JSON.stringify(query)} locale=${JSON.stringify(locale)} limit=${limit ?? 10}`)

      // Search every loaded site and merge hits. Each hit is annotated with
      // its source site so the caller can tell results apart when multiple
      // sites are loaded. Results are ranked globally by score.
      const allHits: SourcedHit[] = []
      let errorResult: { text: string } | undefined
      for (const site of sites) {
        try {
          const result = site.index.search({ query, locale, limit })
          for (const hit of result.hits) {
            allHits.push({ ...hit, site: site.siteUrl })
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          log(`search failed for ${site.siteUrl}: ${message}`)
          errorResult = { text: `Search failed for ${site.siteUrl}: ${message}` }
        }
      }

      if (allHits.length === 0 && errorResult) {
        return {
          isError: true,
          content: [{ type: 'text', text: errorResult.text }],
        }
      }

      allHits.sort((a, b) => b.score - a.score)
      const capped = limit ? allHits.slice(0, limit) : allHits.slice(0, 10)

      const summary = [
        `Found ${allHits.length} result(s) across ${totalDocs} indexed pages from ${sites.length} site(s).`,
        `Showing top ${capped.length}.`,
        '',
      ].join('\n')

      const text = [summary, ...capped.map((hit, i) => formatResultText(hit, i))].join('\n---\n')

      return {
        content: [{ type: 'text', text }],
      }
    },
  )

  return server
}

/**
 * Run the search server over stdio until the client disconnects or the process
 * is signaled. Resolves on clean shutdown.
 */
export async function runMcpSearchServer(sites: LoadedMcpSite[], options: SearchServerOptions = {}): Promise<void> {
  const log = options.log ?? (() => {})
  const server = createMcpSearchServer(sites, options)
  const transport = new StdioServerTransport()
  // Dispose every search index when the client disconnects. StdioServerTransport
  // calls onclose after stdin closes.
  transport.onclose = () => {
    log('MCP transport closed; disposing search indices')
    for (const site of sites) site.index.dispose()
  }
  await server.connect(transport)
  log(`MCP search server listening on stdio (${sites.length} site(s))`)
}

function formatResultText(hit: SourcedHit, index: number): string {
  const lines = [
    `## ${index + 1}. ${hit.title}`,
    `URL: ${hit.path}`,
    `Site: ${hit.site}`,
    `Score: ${hit.score}`,
  ]
  if (hit.locale) {
    lines.push(`Locale: ${hit.locale}`)
  }
  if (hit.excerpt) {
    lines.push('', hit.excerpt)
  }
  if (hit.description) {
    lines.push('', `Description: ${hit.description}`)
  }
  if (hit.keywords?.length > 0) {
    lines.push('', `Keywords: ${hit.keywords.join(', ')}`)
  }
  return lines.join('\n')
}
