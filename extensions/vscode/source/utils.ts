const CONTENT_FILE_PATTERN = /\.(md|mdx|openapi\.(json|ya?ml))$/i

/**
 * Quick local check for whether a file is a Clarify content file.
 * Used to decide whether to hit the route endpoint at all.
 */
export function isContentFile(filePath: string): boolean {
  return CONTENT_FILE_PATTERN.test(filePath)
}
