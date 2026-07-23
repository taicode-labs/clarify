/**
 * Queries the Clarify dev server's `/dev/query-preview-route` endpoint to
 * resolve a content file path to its preview URL.
 *
 * This class is intentionally thin: most route inference logic lives on the
 * CLI side so the extension remains a lightweight editor integration.
 */
export class RouteResolver {
  constructor(private readonly serverUrl: string) {}

  /**
   * Resolve a content file's absolute path to the dev server URL that previews it.
   * Returns null when the file is not a known content route and cannot be inferred.
   */
  async resolveRoute(filePath: string): Promise<string | null> {
    const url = `${this.serverUrl}/dev/query-preview-route`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: filePath }),
    })
    if (!resp.ok) {
      throw new Error(`route endpoint returned ${resp.status}`)
    }
    const data = await resp.json() as { path?: string } | null
    if (!data || !data.path) return null
    return `${this.serverUrl}${data.path}`
  }
}
