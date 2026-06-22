import { existsSync } from 'node:fs'
import { lstat, stat } from 'node:fs/promises'
import { dirname, extname, isAbsolute, join, normalize, relative, resolve } from 'node:path'

import type { CliOptions } from '../options.js'
import { loadClarifyConfig } from '../../core/user-config.js'
import { resolveClarifySite } from '../../core/site.js'
import type { ContentRoute } from '../../types.js'

export type CheckCommandOptions = CliOptions & {
  strict?: boolean
  format?: 'text' | 'json' | string
}

type CheckLevel = 'error' | 'warning'

type CheckDiagnostic = {
  level: CheckLevel
  code: string
  message: string
  filePath?: string
  routePath?: string
}

type CheckResult = {
  errors: CheckDiagnostic[]
  warnings: CheckDiagnostic[]
}

const LOCAL_LINK_PATTERN = /(?<!!)(?:\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)|<a\s+[^>]*href=["']([^"']+)["'])/gi
const ROUTE_EXTENSIONS = new Set(['.md', '.mdx'])
const IGNORED_SCHEMES = /^[a-z][a-z0-9+.-]*:/i

function addDiagnostic(result: CheckResult, diagnostic: CheckDiagnostic): void {
  if (diagnostic.level === 'error') result.errors.push(diagnostic)
  else result.warnings.push(diagnostic)
}

function normalizeRoutePath(path: string): string {
  const [withoutHash] = path.split('#')
  const clean = withoutHash.replace(/\/index$/, '') || '/'
  return clean.startsWith('/') ? clean : `/${clean}`
}

function routePathCandidates(href: string, route: ContentRoute): string[] {
  const [withoutHashOrQuery] = href.split(/[?#]/)
  if (!withoutHashOrQuery || withoutHashOrQuery.startsWith('#')) return []
  if (withoutHashOrQuery.startsWith('/')) return [normalizeRoutePath(withoutHashOrQuery)]

  const routeDir = dirname(route.path)
  const joined = normalize(join(routeDir, withoutHashOrQuery)).replaceAll('\\', '/')
  const extension = extname(joined)
  const base = ROUTE_EXTENSIONS.has(extension) ? joined.slice(0, -extension.length) : joined
  return [normalizeRoutePath(base)]
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath)
    return true
  } catch {
    return false
  }
}

function isLocalHref(href: string): boolean {
  return Boolean(href) && !href.startsWith('#') && !href.startsWith('//') && !IGNORED_SCHEMES.test(href)
}

async function resolveLocalFileLink(href: string, route: ContentRoute, contentRoot: string): Promise<boolean> {
  const [withoutHashOrQuery] = href.split(/[?#]/)
  if (!withoutHashOrQuery || withoutHashOrQuery.startsWith('/')) return false

  const target = resolve(dirname(route.filePath), withoutHashOrQuery)
  const relativeTarget = relative(contentRoot, target)
  if (relativeTarget.startsWith('..') || isAbsolute(relativeTarget)) return false
  if (await pathExists(target)) return true

  if (!extname(target)) {
    return pathExists(`${target}.md`) || pathExists(`${target}.mdx`) || pathExists(join(target, 'index.md')) || pathExists(join(target, 'index.mdx'))
  }
  return false
}

async function checkContentDirectory(contentRoot: string, result: CheckResult): Promise<void> {
  try {
    const stats = await lstat(contentRoot)
    if (!stats.isDirectory()) {
      addDiagnostic(result, {
        level: 'error',
        code: 'content-not-directory',
        message: `Content path is not a directory: ${contentRoot}`,
        filePath: contentRoot,
      })
    }
  } catch {
    addDiagnostic(result, {
      level: 'error',
      code: 'content-missing',
      message: `Content directory does not exist: ${contentRoot}`,
      filePath: contentRoot,
    })
  }
}

function checkDuplicateRoutes(routes: ContentRoute[], result: CheckResult): void {
  const byPath = new Map<string, ContentRoute[]>()
  for (const route of routes) {
    const key = `${route.locale ?? ''}:${route.path}`
    byPath.set(key, [...(byPath.get(key) ?? []), route])
  }

  for (const duplicated of byPath.values()) {
    if (duplicated.length < 2) continue
    for (const route of duplicated) {
      addDiagnostic(result, {
        level: 'error',
        code: 'duplicate-route',
        message: `Route "${route.path}" is defined by multiple files: ${duplicated.map(route => relative(process.cwd(), route.filePath)).join(', ')}`,
        filePath: route.filePath,
        routePath: route.path,
      })
    }
  }
}

function checkFallbackRoutes(routes: ContentRoute[], result: CheckResult): void {
  for (const route of routes) {
    if (!route.isFallback) continue
    addDiagnostic(result, {
      level: 'warning',
      code: 'i18n-fallback-route',
      message: `Route "${route.path}" falls back to ${route.locale ?? 'default'} content from ${relative(process.cwd(), route.filePath)}`,
      filePath: route.filePath,
      routePath: route.path,
    })
  }
}

async function checkLocalLinks(routes: ContentRoute[], contentRoot: string, result: CheckResult): Promise<void> {
  const routePaths = new Set(routes.map(route => route.path))

  for (const route of routes) {
    if (route.kind !== 'mdx' || !route.content) continue
    for (const match of route.content.matchAll(LOCAL_LINK_PATTERN)) {
      const href = match[1] ?? match[2]
      if (!href || !isLocalHref(href)) continue
      const candidates = routePathCandidates(href, route)
      if (candidates.some(candidate => routePaths.has(candidate))) continue
      if (await resolveLocalFileLink(href, route, contentRoot)) continue

      addDiagnostic(result, {
        level: 'error',
        code: 'broken-link',
        message: `Broken local link "${href}" in route "${route.path}"`,
        filePath: route.filePath,
        routePath: route.path,
      })
    }
  }
}

function printTextResult(result: CheckResult, strict: boolean): void {
  const diagnostics = [...result.errors, ...result.warnings]
  if (diagnostics.length === 0) {
    console.log('✓ Clarify check passed')
    return
  }

  for (const diagnostic of diagnostics) {
    const location = diagnostic.filePath ? ` ${relative(process.cwd(), diagnostic.filePath)}` : ''
    const route = diagnostic.routePath ? ` (${diagnostic.routePath})` : ''
    console.log(`${diagnostic.level.toUpperCase()} ${diagnostic.code}${location}${route}`)
    console.log(`  ${diagnostic.message}`)
  }

  const warningExit = strict && result.warnings.length > 0
  console.log(`\n${result.errors.length} error(s), ${result.warnings.length} warning(s)${warningExit ? ' (--strict treats warnings as failures)' : ''}`)
}

export async function runCheck(options: CheckCommandOptions = {}): Promise<void> {
  const root = resolve(options.root ?? process.cwd())
  const userConfig = existsSync(root) ? await loadClarifyConfig(root, { command: 'build', mode: 'production' }) : {}
  const site = await resolveClarifySite({
    ...userConfig,
    projectRoot: root,
    rootDirectory: options.content,
    outputDirectory: options.output,
  }, { includeHtmlShellPlugin: false })

  const result: CheckResult = { errors: [], warnings: [] }
  await checkContentDirectory(site.contentRoot, result)
  checkDuplicateRoutes(site.routes, result)
  checkFallbackRoutes(site.routes, result)
  await checkLocalLinks(site.routes, site.contentRoot, result)

  if (options.format === 'json') {
    console.log(JSON.stringify(result, null, 2))
  } else {
    printTextResult(result, Boolean(options.strict))
  }

  if (result.errors.length > 0 || (options.strict && result.warnings.length > 0)) {
    process.exitCode = 1
  }
}
