import type { IncomingMessage, ServerResponse } from 'node:http'
import { relative } from 'node:path'

import { basePathFromRef, localizedRoutePath, normalizePath } from '../parsers/routes.js'
import type { ContentRoute, ResolvedProjectConfig } from '../types.js'

/**
 * Dev-only HTTP endpoint that exposes the in-memory route manifest so external
 * tools (e.g. the VS Code extension) can resolve a content file path to its
 * preview URL.
 *
 * Mounted at `POST /dev/query-preview-route`:
 *  - Empty body → returns the full route list (minimal fields).
 *  - `{ "file": "<absPath>" }` → returns the single matching route. When the
 *    project uses i18n, the route whose locale matches the file's directory is
 *    preferred; otherwise the default-locale route is returned. If the file is
 *    not a registered route, a best-effort preview path is derived from the
 *    file path relative to the content root.
 *
 * Uses POST + JSON body (instead of GET + query string) because file paths may
 * contain characters that are awkward to encode in a URL query parameter.
 */
export const CLARIFY_DEV_ROUTE_ENDPOINT = '/dev/query-preview-route'

export type DevRouteEntry = {
  path: string
  filePath: string
  locale?: string
  basePath?: string
  kind: string
  title: string
  /** Whether the route was derived from the file path rather than matched in the route manifest. */
  inferred?: boolean
}

export type DevRouteResponse = DevRouteEntry | DevRouteEntry[] | null

/** Serialize a ContentRoute into the minimal shape exposed to tooling. */
export function toDevRouteEntry(route: ContentRoute): DevRouteEntry {
  return {
    path: route.path,
    filePath: route.filePath,
    locale: route.locale,
    basePath: route.basePath,
    kind: route.kind,
    title: route.title,
  }
}

/**
 * Resolve a single file path to its preview route.
 *
 * Selection order:
 *  1. Routes whose `filePath` exactly matches.
 *  2. Among matches, prefer the one whose `locale` matches the file's locale
 *     directory (e.g. `source/zh-CN/x.mdx` → locale `zh-CN`).
 *  3. If no locale match, fall back to the default locale (if i18n is enabled)
 *     or the first match.
 */
export function resolveRouteForFile(filePath: string, routes: ContentRoute[], defaultLocale?: string): ContentRoute | undefined {
  const matches = routes.filter(r => r.filePath === filePath)
  if (matches.length === 0) return undefined
  if (matches.length === 1) return matches[0]

  const fileLocale = inferLocaleFromPath(filePath)
  if (fileLocale) {
    const localeMatch = matches.find(r => r.locale === fileLocale)
    if (localeMatch) return localeMatch
  }

  if (defaultLocale) {
    const defaultMatch = matches.find(r => r.locale === defaultLocale)
    if (defaultMatch) return defaultMatch
  }

  return matches[0]
}

/**
 * Derive a best-effort preview route for a file that is not in the route
 * manifest (e.g. a draft or newly created file). The path is computed from the
 * file's location relative to the content root, following the same convention
 * as route discovery (`source/{locale}/path/index.mdx` → `/{locale}/path`).
 *
 * Returns null when the file is outside the content root or is not a
 * recognized content file type.
 */
export function inferRouteForFile(filePath: string, contentRoot: string, defaultLocale?: string): DevRouteEntry | null {
  const ref = relative(contentRoot, filePath)
  if (!ref || ref.startsWith('..')) return null

  const isMdx = /\.mdx?$/.test(filePath)
  const isOpenApi = /\.openapi\.(json|ya?ml)$/.test(filePath)
  if (!isMdx && !isOpenApi) return null

  const segments = ref.split('/')
  const fileLocale = inferLocaleFromPath(filePath)
  const localeSegmentIndex = fileLocale ? segments.indexOf(fileLocale) : -1
  const refWithoutLocale = localeSegmentIndex >= 0 ? segments.slice(localeSegmentIndex + 1).join('/') : ref

  const basePath = basePathFromRef(refWithoutLocale)
  const path = fileLocale && defaultLocale
    ? localizedRoutePath(basePath, fileLocale, { defaultLocale, missing: 'fallback', locales: [] })
    : basePath

  const title = segments[segments.length - 1]?.replace(/\.(mdx?|openapi\.(json|ya?ml))$/, '') || 'Untitled'

  return {
    path: normalizePath(path),
    filePath,
    locale: fileLocale,
    basePath: normalizePath(basePath),
    kind: isMdx ? 'mdx' : 'openapi',
    title,
    inferred: true,
  }
}

/** Best-effort locale inference from a file path segment like `.../zh-CN/x.mdx`. */
function inferLocaleFromPath(filePath: string): string | undefined {
  const segments = filePath.split('/')
  for (const segment of segments) {
    if (/^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$/.test(segment)) {
      return segment
    }
  }
  return undefined
}

/** Read and parse the JSON body of an IncomingMessage. */
function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolveBody, reject) => {
    const chunks: Buffer[] = []
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('error', reject)
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8').trim()
      if (!raw) return resolveBody({})
      try {
        resolveBody(JSON.parse(raw))
      } catch (err) {
        reject(err)
      }
    })
  })
}

/**
 * Handle a request to the dev route endpoint. Pure function — does not touch
 * the network directly, only reads the request body and writes to `res`.
 */
export async function handleDevRouteRequest(req: IncomingMessage, res: ServerResponse, routes: ContentRoute[], projectConfig: ResolvedProjectConfig, contentRoot: string): Promise<void> {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  let body: unknown
  try {
    body = await readJsonBody(req)
  } catch {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'Invalid JSON body' }))
    return
  }

  const file = typeof body === 'object' && body !== null ? (body as { file?: unknown }).file : undefined

  if (typeof file === 'string' && file.length > 0) {
    const route = resolveRouteForFile(file, routes, projectConfig.i18n?.defaultLocale)
    if (route) {
      res.end(JSON.stringify(toDevRouteEntry(route)))
      return
    }
    const inferred = inferRouteForFile(file, contentRoot, projectConfig.i18n?.defaultLocale)
    res.end(JSON.stringify(inferred))
    return
  }

  res.end(JSON.stringify(routes.map(toDevRouteEntry)))
}
