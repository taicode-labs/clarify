import { escapeHtml } from '../../parsers/markdown/utils.js'
import type { ClarifyProjectContext, ContentRoute, ResolvedProjectConfig } from '../../types.js'

/**
 * HTML template manipulation helpers used during SSG.
 *
 * The SSG renderer needs to mutate the built `index.html` per route
 * (title, description/keywords meta, canonical link, `<html lang/dir>`,
 * and the root `<div>` content). These operations are all string-based
 * because the template is a raw HTML string, not a parsed DOM. Keeping them
 * in one module centralizes every HTML-mutation regex so they can be audited
 * together and so `ssg.ts` stays focused on the render pipeline.
 */

function resolveProjectConfigFromContext(contextOrConfig: ClarifyProjectContext | ResolvedProjectConfig): ResolvedProjectConfig {
  return 'projectConfig' in contextOrConfig ? contextOrConfig.projectConfig : contextOrConfig
}

function routeTitle(contextOrConfig: ClarifyProjectContext | ResolvedProjectConfig, route?: ContentRoute): string {
  const projectConfig = resolveProjectConfigFromContext(contextOrConfig)
  const title = route?.title?.trim()
  if (!title || title === projectConfig.title) return projectConfig.title
  return `${title} - ${projectConfig.title}`
}

function canonicalUrl(contextOrConfig: ClarifyProjectContext | ResolvedProjectConfig, route: ContentRoute): string | undefined {
  const projectConfig = resolveProjectConfigFromContext(contextOrConfig)
  if (!projectConfig.siteUrl || !route.alternates || !route.locale) return undefined
  const prefixedPath = route.alternates[route.locale]
  if (!prefixedPath || prefixedPath === route.path) return undefined

  const base = projectConfig.siteUrl.replace(/\/+$/, '')
  const prefix = (!projectConfig.routePrefix || projectConfig.routePrefix === '/')
    ? ''
    : `/${projectConfig.routePrefix.replace(/^\/+|\/+$/g, '')}`
  return `${base}${prefix}${prefixedPath}`
}

/** Inject `lang` (and optional `dir`) onto the `<html>` tag for the route locale. */
export function injectHtmlLocaleAttributes(html: string, contextOrConfig: ClarifyProjectContext | ResolvedProjectConfig, route?: ContentRoute): string {
  const projectConfig = resolveProjectConfigFromContext(contextOrConfig)
  const localeCode = route?.locale ?? projectConfig.i18n?.defaultLocale
  if (!localeCode) return html

  const localeConfig = projectConfig.i18n?.locales.find(locale => locale.code === localeCode)
  const dir = localeConfig?.dir

  return html.replace(/<html\b([^>]*)>/i, (_match, attributes: string) => {
    let nextAttributes = attributes
      .replace(/\s+lang=("[^"]*"|'[^']*'|[^\s>]*)/i, '')
      .replace(/\s+dir=("[^"]*"|'[^']*'|[^\s>]*)/i, '')

    nextAttributes = `${nextAttributes} lang="${escapeHtml(localeCode)}"`
    if (dir) nextAttributes = `${nextAttributes} dir="${escapeHtml(dir)}"`
    return `<html${nextAttributes}>`
  })
}

/** Set, replace, or remove a `<meta name="...">` tag in `<head>`. */
export function setNamedMeta(html: string, name: string, content: string | undefined): string {
  const metaPattern = new RegExp(`<meta\\b(?=[^>]*\\bname=["']${name}["'])[^>]*>\\n?`, 'i')
  if (!content) return html.replace(metaPattern, '')

  const meta = `<meta name="${name}" content="${escapeHtml(content)}" />`
  if (metaPattern.test(html)) return html.replace(metaPattern, meta)
  return html.replace('</head>', `  ${meta}\n  </head>`)
}

/** Remove any existing canonical link and (if a URL is resolved) inject a fresh one. */
export function injectCanonicalUrl(html: string, contextOrConfig: ClarifyProjectContext | ResolvedProjectConfig, route?: ContentRoute): string {
  const url = route ? canonicalUrl(contextOrConfig, route) : undefined
  // Remove any existing canonical link
  html = html.replace(/<link\b[^>]*\brel=["']canonical["'][^>]*\/?>\n?/gi, '')
  if (!url) return html
  return html.replace('</head>', `  <link rel="canonical" href="${escapeHtml(url)}" />\n  </head>`)
}

/**
 * Render the SSR result into the built HTML template: set `<title>`, the
 * description/keywords meta, the canonical link, the `<html lang/dir>`, and
 * replace the `#root` content with the rendered app HTML.
 */
export function injectSSRIntoTemplate(template: string, appHtml: string, contextOrConfig: ClarifyProjectContext | ResolvedProjectConfig, route?: ContentRoute): string {
  const projectConfig = resolveProjectConfigFromContext(contextOrConfig)
  let html = injectHtmlLocaleAttributes(template, contextOrConfig, route)

  // Replace <title>...</title>
  html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(routeTitle(contextOrConfig, route))}</title>`)

  html = setNamedMeta(html, 'description', route?.description ?? projectConfig.description)
  html = setNamedMeta(html, 'keywords', route?.keywords?.join(', '))
  html = injectCanonicalUrl(html, contextOrConfig, route)

  // Replace <div id="root">...</div> with SSR rendered content
  // For bare alias routes (e.g., /path) in multilingual sites, mark the root div
  // with data-pagefind-ignore to prevent Pagefind from indexing duplicates
  const dataPagefindIgnore = route?.isBareAlias ? ' data-pagefind-ignore' : ''
  html = html.replace(/<div id="root">([\s\S]*?)<\/div>/, `<div id="root"${dataPagefindIgnore}>${appHtml}</div>`)

  return html
}
