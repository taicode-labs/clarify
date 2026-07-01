/**
 * Project metadata fetched from the Clarify dev server's `/dev/project-info`
 * endpoint. This is the authoritative source for which files Clarify
 * recognizes — the extension avoids hardcoding these conventions so it stays
 * in sync with whatever CLI version is running.
 */
/**
 * Metadata fetched from the running Clarify dev server.
 *
 * The extension uses this data to stay aligned with the CLI's active
 * configuration and file discovery rules rather than relying on hardcoded
 * defaults.
 */
export type ProjectInfo = {
  configFilenames: readonly string[]
  contentFileExtensions: readonly string[]
  contentRoot: string
  projectRoot: string
  i18n?: {
    defaultLocale: string
    locales: string[]
  }
}

/**
 * Bootstrap defaults used before the dev server is running and the
 * `/dev/project-info` endpoint has been queried. These mirror the CLI's
 * current defaults but are only a best-effort guess — once the server is up,
 * `fetchProjectInfo` replaces them with the authoritative values.
 */
export const BOOTSTRAP_CONFIG_FILENAMES = ['clarify.ts', 'clarify.js', 'clarify.json'] as const
export const BOOTSTRAP_CONTENT_EXTENSIONS = ['.md', '.mdx', '.openapi.json', '.openapi.yaml', '.openapi.yml'] as const
export const BOOTSTRAP_CONTENT_ROOT = 'source'

/**
 * Fetch project metadata from the running dev server.
 *
 * Returns `null` when the endpoint is unavailable (e.g. older CLI version
 * that predates the endpoint). Callers should fall back to bootstrap defaults
 * in that case.
 */
export async function fetchProjectInfo(serverUrl: string): Promise<ProjectInfo | null> {
  try {
    const resp = await fetch(`${serverUrl}/dev/project-info`)
    if (!resp.ok) return null
    const data = (await resp.json()) as ProjectInfo
    if (!data || !Array.isArray(data.configFilenames) || !Array.isArray(data.contentFileExtensions)) {
      return null
    }
    return data
  } catch {
    // The endpoint may not exist on older CLI versions or the server may
    // not yet be ready. In that case we gracefully fall back to bootstrap
    // conventions.
    return null
  }
}
