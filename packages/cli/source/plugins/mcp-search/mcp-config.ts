import type { ResolvedProjectConfig } from '../../types.js'

/**
 * Descriptor for a single MCP capability surfaced by a Clarify site.
 *
 * Capabilities are intentionally open-ended so future versions can add
 * `resources`, `prompts`, etc. without reshaping the top-level file. Each
 * capability carries its own metadata block; the CLI selects the block(s)
 * it understands and ignores the rest.
 */
export type McpCapability = McpSearchCapability

/**
 * Full-text search capability backed by an Orama binary index.
 */
export type McpSearchCapability = {
  /** Capability discriminator. */
  type: 'search'
  /**
   * Root-relative path to the Orama binary index (`.msp`) produced at build
   * time. Always served from the site root, so it already includes the
   * routePrefix when one is configured.
   */
  indexPath: string
  /** SHA-256 hash of the index payload at indexPath, for cache freshness checks. */
  indexHash?: string
  /** Locale used when the caller does not specify one. Drives tokenizer. */
  defaultLocale?: string
  /** Number of documents stored in the index. */
  documentCount: number
  /** Locales present in the index, for surfacing in tool descriptions. */
  locales: string[]
}

/**
 * MCP server descriptor emitted to `<output>/mcp.json` during build.
 *
 * Consumed by `clarify mcp <url>` to bootstrap a local MCP server that
 * exposes site capabilities (currently full-text search) to LLM clients.
 * The descriptor points the CLI at the Orama binary index (`.msp`) written
 * alongside `mcp.json` and carries the locale metadata needed to reconstruct
 * the tokenizer at runtime.
 */
export type McpSiteConfig = {
  /** Schema version of this file. Bumped on breaking shape changes. */
  version: 3
  site: {
    title?: string
    description?: string
    /** Canonical public site URL, if `siteUrl` is configured. */
    url?: string
    /** Route prefix where the site is mounted. Default: '/'. */
    routePrefix: string
  }
  /**
   * Capability map keyed by capability id. The id is stable across builds so
   * clients can address a specific capability (e.g. `search`) even as new
   * ones are added. Only capabilities actually emitted by the build are
   * present; an absent key means the site does not provide that capability.
   */
  capabilities: {
    search?: McpSearchCapability
  }
}

/**
 * Normalize a route prefix into a root-relative path segment.
 *
 * `'/'` -> `''`, `'/docs'` -> `'/docs'`, `'docs/'` -> `'/docs'`.
 */
function normalizePrefix(routePrefix: string | undefined): string {
  if (!routePrefix || routePrefix === '/') return ''
  return `/${routePrefix.replace(/^\/+|\/+$/g, '')}`
}

export type CreateMcpSiteConfigOptions = {
  documentCount: number
  locales: string[]
  indexHash: string
}

/**
 * Assemble the MCP site config from build-time metadata.
 *
 * Unlike the previous pagefind-based descriptor, this no longer reads an
 * entry JSON file - the Orama index is a single binary blob, so the caller
 * supplies the document count and locale list directly from the build step
 * that produced the index.
 */
export function createMcpSiteConfig(projectConfig: ResolvedProjectConfig, options: CreateMcpSiteConfigOptions): McpSiteConfig {
  const prefix = normalizePrefix(projectConfig.routePrefix)
  return {
    version: 3,
    site: {
      title: projectConfig.title,
      description: projectConfig.description,
      url: projectConfig.siteUrl,
      routePrefix: projectConfig.routePrefix ?? '/',
    },
    capabilities: {
      search: {
        type: 'search',
        indexPath: `${prefix}/mcp-search.msp`,
        indexHash: options.indexHash,
        defaultLocale: projectConfig.locales?.default,
        documentCount: options.documentCount,
        locales: options.locales,
      },
    },
  }
}
