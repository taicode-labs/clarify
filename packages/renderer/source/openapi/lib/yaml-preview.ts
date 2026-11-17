/**
 * Pretty-print a YAML response body.
 *
 * `yaml` is ~30 kB compressed and is only needed when a user previews a YAML
 * response, so it is loaded on demand instead of shipping with the first-load
 * bundle.
 */
export async function formatYamlPreview(body: string): Promise<string> {
  try {
    const { parse, stringify } = await import('yaml')
    return stringify(parse(body)).trimEnd()
  } catch {
    return body
  }
}
