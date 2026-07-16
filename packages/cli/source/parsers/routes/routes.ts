import { readdir, readFile, stat } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'

import GithubSlugger from 'github-slugger'
import { toString } from 'mdast-util-to-string'
import { remark } from 'remark'
import { visit } from 'unist-util-visit'

import type { ClarifyPage, ClarifyPageRouteIntent, ContentRoute, ContentSection, ClarifyNavigationNode, ClarifyPagesConfig, ClarifyPagesGroup, ClarifyPagesItem, ClarifyRouteIntent, ClarifyLocalizedText, ClarifyTabsConfig, LocalizedNavigation, LocalizedTabbedNavigation, NavigationSection, ResolvedClarifyLocalesConfig, TabbedNavigation } from '../../types.js'
import { createContentProcessor, type ContentProcessor } from '../content/content.js'
import { compileMdxContent } from '../markdown/mdx.js'

export type FindContentRoutesOptions = {
  contentProcessor?: ContentProcessor
}

export function kebabToTitle(str: string): string {
  return str
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function parseMdxTree(content: string) {
  return remark.parse(content)
}

async function compileRouteDiagnostic(content: string, filePath: string, baseDir: string) {
  // `.md` routes intentionally skip JSX/MDX syntax validation.
  // Markdown and MDX follow separate compiler semantics in the adapter layer.
  if (extname(filePath).toLowerCase() !== '.mdx') return undefined

  const result = await compileMdxContent(content, filePath, baseDir)
  return result.ok ? undefined : result.diagnostic
}

/** 从内容中提取第一个 H1 标题 */
function extractH1(content: string): string {
  const tree = parseMdxTree(content)
  let title = ''
  visit(tree, 'heading', (node) => {
    if (!title && node.depth === 1) {
      title = toString(node)
    }
  })
  return title
}

/** 从 MDX/Markdown 内容中提取 H2/H3 章节 */
function extractMdxSections(content: string): ContentSection[] {
  const sections: ContentSection[] = []
  const slugger = new GithubSlugger()
  const tree = parseMdxTree(content)
  visit(tree, 'heading', (node) => {
    if (node.depth !== 2 && node.depth !== 3) return
    const title = toString(node)
    sections.push({ id: slugger.slug(title), title, level: node.depth })
  })
  return sections
}

function navigationSections(sections: ContentSection[]): NavigationSection[] {
  return sections.map(section => ({ id: section.id, title: section.title, level: section.level, badge: section.badge, tags: section.tags }))
}

export function normalizePath(path: string): string {
  const clean = '/' + path.replace(/^\/+|\/+$/g, '')
  return clean === '/' ? '/' : clean.replace(/\/+/g, '/')
}

function pathSegmentFromOpenAPITag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'tag'
}

function openAPITagsPathSegment(tags: string[]): string {
  return tags.map(pathSegmentFromOpenAPITag).join('-')
}

export function basePathFromRef(ref: string): string {
  const withoutExtension = ref.replace(/\.mdx?$/, '').replace(/\.openapi\.(json|yaml|yml)$/, '')
  return normalizePath(withoutExtension === 'index' ? '/' : withoutExtension.replace(/\/index$/, ''))
}

export function openAPIPagePathFromRef(ref: string, tagFilter?: string[], explicitPath?: string): string {
  if (explicitPath) return normalizePath(explicitPath)
  const basePath = basePathFromRef(ref)
  if (!tagFilter?.length) return basePath
  return normalizePath(`${basePath}/${openAPITagsPathSegment(tagFilter)}`)
}

export function routePathFromRef(ref: string, explicitPath?: string): string {
  return explicitPath ? normalizePath(explicitPath) : basePathFromRef(ref)
}

export function virtualModuleIdFromRef(ref: string): string {
  return 'virtual:clarify-page/' + ref
    .replace(/\.mdx?$/, '')
    .replace(/\.openapi\.(json|yaml|yml)$/, '')
    .replace(/\/+/g, '/')
}

export function localizedRoutePath(basePath: string, locale: string, _i18n: ResolvedClarifyLocalesConfig): string {
  const normalizedBasePath = normalizePath(basePath)
  const prefix = normalizePath(locale)
  return normalizedBasePath === '/' ? prefix : normalizePath(`${prefix}${normalizedBasePath}`)
}

function resolveLocalizedText(text: ClarifyLocalizedText | undefined, locale: string, fallbackLocale?: string): string | undefined {
  if (typeof text === 'string') return text
  if (text === undefined) return undefined
  return text[locale] ?? (fallbackLocale ? text[fallbackLocale] : undefined) ?? Object.values(text)[0]
}

export async function findContentRoutes(dir: string, base: string = dir, options: FindContentRoutesOptions = {}): Promise<ContentRoute[]> {
  const routes: ContentRoute[] = []
  // Skip directories that do not exist instead of throwing; `stat` rejects for
  // missing paths, so treat that as an empty result.
  let dirStat
  try {
    dirStat = await stat(dir)
  } catch {
    return routes
  }
  if (!dirStat.isDirectory()) return routes

  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      routes.push(...await findContentRoutes(fullPath, base, options))
    } else if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
      const relativePath = relative(base, fullPath)
      const pathParts = relativePath.replace(/\.mdx?$/, '').split('/')
      const path = '/' + pathParts.map(p => p === 'index' ? '' : p).filter(Boolean).join('/')
      const cleanPath = path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'

      const source = await readFile(fullPath, 'utf-8')
      const { frontmatter, content } = await (options.contentProcessor ?? createContentProcessor()).processMdx(source, fullPath)
      const page: ClarifyPage = {
        path: cleanPath,
        filePath: fullPath,
        frontmatter,
        content,
      }
      const diagnostic = await compileRouteDiagnostic(page.content, fullPath, base)

      let title = typeof page.frontmatter.title === 'string' ? page.frontmatter.title : ''
      if (!title) {
        const lastPart = pathParts[pathParts.length - 1] ?? ''
        const stem = lastPart === 'index'
          ? (pathParts.length >= 2 ? pathParts[pathParts.length - 2]! : extractH1(page.content))
          : lastPart
        title = kebabToTitle(stem) || 'Untitled'
      }

      routes.push({
        kind: 'mdx',
        path: cleanPath,
        basePath: cleanPath,
        meta: {
          title,
          description: typeof page.frontmatter.description === 'string' ? page.frontmatter.description : undefined,
          keywords: frontmatterKeywords(page.frontmatter),
          sections: extractMdxSections(page.content),
        },
        module: {
          virtualModuleId: 'virtual:clarify-page/' + relativePath.replace(/\.mdx?$/, '').replace(/\/+/g, '/'),
        },
        source: {
          filePath: fullPath,
          frontmatter: page.frontmatter,
          content: page.content,
        },
        diagnostic,
      })
    }
  }
  return routes
}

function virtualModuleIdForLocalizedRoute(contentRoot: string, filePath: string): string {
  return 'virtual:clarify-page/' + relative(contentRoot, filePath)
    .replace(/\.mdx?$/, '')
    .replace(/\.openapi\.(json|yaml|yml)$/, '')
    .replace(/\/+/g, '/')
}

function frontmatterKeywords(frontmatter: Record<string, unknown>): string[] | undefined {
  const value = frontmatter.keywords ?? frontmatter.keyword ?? frontmatter.tags
  const keywords = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : typeof value === 'string'
      ? value.split(',').map(keyword => keyword.trim()).filter(Boolean)
      : []

  return keywords.length > 0 ? keywords : undefined
}

export function withAlternates(route: ContentRoute, routes: ContentRoute[], locales: ResolvedClarifyLocalesConfig): ContentRoute {
  const basePath = route.basePath ?? route.path
  // 排除裸路径别名，避免覆盖带 locale 前缀的路径
  const routeByLocaleAndBase = new Map(
    routes
      .filter(r => !r.locale || r.path === `/${r.locale}` || r.path.startsWith(`/${r.locale}/`))
      .map(r => [`${r.locale ?? ''}:${r.basePath ?? r.path}`, r]),
  )
  const alternates = Object.fromEntries(
    locales.locales.flatMap((locale) => {
      const alternate = routeByLocaleAndBase.get(`${locale.code}:${basePath}`)
      return alternate ? [[locale.code, alternate.path]] : []
    })
  )
  return { ...route, alternates }
}

/**
 * 为默认语言的 locale-prefixed 路由生成无前缀的"裸路径别名"，方便不带语言
 * 前缀的 URL 也能访问。标记 `isBareAlias` 以便搜索索引生成时过滤重复索引。
 */
function generateBareAliases(routes: ContentRoute[], locales: ResolvedClarifyLocalesConfig): ContentRoute[] {
  const bareRoutes: ContentRoute[] = []
  const seenBare = new Set(routes.map(r => r.path))
  for (const route of routes) {
    if (route.locale !== locales.default) continue
    const bp = route.basePath ?? route.path
    if (bp === route.path || seenBare.has(bp)) continue
    seenBare.add(bp)
    bareRoutes.push({ ...route, path: bp, isBareAlias: true })
  }
  return bareRoutes
}

export async function findLocalizedContentRoutes(contentRoot: string, locales?: ResolvedClarifyLocalesConfig, options: FindContentRoutesOptions = {}): Promise<ContentRoute[]> {
  if (!locales) return findContentRoutes(contentRoot, contentRoot, options)

  const localizedRoutes: ContentRoute[] = []
  for (const locale of locales.locales) {
    const localeRoot = join(contentRoot, locale.code)
    const discovered = await findContentRoutes(localeRoot, localeRoot, options)
    for (const route of discovered) {
      const basePath = route.basePath ?? route.path
      localizedRoutes.push({
        ...route,
        path: localizedRoutePath(basePath, locale.code, locales),
        basePath,
        locale: locale.code,
        module: { virtualModuleId: virtualModuleIdForLocalizedRoute(contentRoot, route.source.filePath) },
      })
    }
  }

  if (locales.missing === 'fallback') {
    const routeByLocaleAndBase = new Map(localizedRoutes.map(route => [`${route.locale ?? ''}:${route.basePath ?? route.path}`, route]))
    const defaultRoutes = localizedRoutes.filter(route => route.locale === locales.default)
    for (const sourceRoute of defaultRoutes) {
      const basePath = sourceRoute.basePath ?? sourceRoute.path
      for (const locale of locales.locales) {
        const key = `${locale.code}:${basePath}`
        if (routeByLocaleAndBase.has(key)) continue
        localizedRoutes.push({
          ...sourceRoute,
          path: localizedRoutePath(basePath, locale.code, locales),
          locale: locale.code,
          isFallback: true,
        })
      }
    }
  }

  const routesWithAlternates = localizedRoutes.map(route => withAlternates(route, localizedRoutes, locales))

  return [...routesWithAlternates, ...generateBareAliases(routesWithAlternates, locales)]
}

export function buildNavigation(routes: ContentRoute[]): ClarifyNavigationNode[] {
  const root: ClarifyNavigationNode[] = []

  for (const route of routes) {
    if (route.path === '/' || (route.basePath ?? route.path) === '/404') continue // 首页和 404 不放入侧边栏

    const parts = route.path.replace(/^\//, '').split('/')
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const pathSoFar = '/' + parts.slice(0, i + 1).join('/')
      let node = current.find(n => n.path === pathSoFar)
      if (!node) {
        node = { path: pathSoFar, title: i === parts.length - 1 ? route.meta.title : kebabToTitle(parts[i]), children: [] }
        current.push(node)
      }
      if (i === parts.length - 1 && route.meta.sections) {
          node.sections = navigationSections(route.meta.sections)
      }
      if (i < parts.length - 1) {
        node.children = node.children ?? []
        current = node.children
      }
    }
  }

  return root
}

export function routeIntentFromPagesItem(
  item: ClarifyPagesItem
): ClarifyRouteIntent {
  if (typeof item === 'string') return { kind: 'page', ref: item }
  if ('group' in item) throw new Error('Navigation groups do not resolve to route intents')
  if ('openapi' in item) return { kind: 'openapi', ref: item.openapi, tagFilter: item.filter?.tags, path: item.path, title: item.title, icon: item.icon }
  return { kind: 'page', ref: item.page, path: item.path, redirect: item.redirect, title: item.title, icon: item.icon }
}

function firstNavigationPath(nodes: ClarifyNavigationNode[]): string {
  for (const node of nodes) {
    if (node.path) return node.path
    const childPath = node.children ? firstNavigationPath(node.children) : undefined
    if (childPath) return childPath
  }
  return '/'
}

function collectExplicitPagePathIntents(tabs?: ClarifyTabsConfig): Array<ClarifyPageRouteIntent & { path: string }> {
  const intents: Array<ClarifyPageRouteIntent & { path: string }> = []

  const collectItems = (items: ClarifyPagesItem[]) => {
    for (const item of items) {
      if (typeof item !== 'string' && 'group' in item) {
        collectItems(item.pages)
      } else if (typeof item !== 'string' && 'page' in item && item.path) {
        const intent = routeIntentFromPagesItem(item)
        if (intent.kind === 'page' && intent.path) intents.push({ ...intent, path: intent.path })
      }
    }
  }

  for (const tab of tabs ?? []) {
    if (!tab.pages || tab.pages === 'FileTree') continue
    for (const group of tab.pages) {
      collectItems(group.pages)
    }
  }

  return intents
}

export function applyConfiguredPageRoutePaths(routes: ContentRoute[], tabs?: ClarifyTabsConfig, locales?: ResolvedClarifyLocalesConfig): ContentRoute[] {
  const pageIntents = collectExplicitPagePathIntents(tabs)
  if (!pageIntents.length) return routes

  const additions: ContentRoute[] = []
  const existingKeys = new Set(routes.map(route => `${route.locale ?? ''}:${route.basePath ?? route.path}`))

  for (const intent of pageIntents) {
    const sourceBasePath = routePathFromRef(intent.ref)
    const targetBasePath = routePathFromRef(intent.ref, intent.path)
    if (sourceBasePath === targetBasePath) continue

    for (const route of routes) {
      if (route.kind !== 'mdx' || (route.basePath ?? route.path) !== sourceBasePath) continue

      const key = `${route.locale ?? ''}:${targetBasePath}`
      if (existingKeys.has(key)) continue
      existingKeys.add(key)

      additions.push({
        ...route,
        path: route.locale && locales ? localizedRoutePath(targetBasePath, route.locale, locales) : targetBasePath,
        basePath: targetBasePath,
      })
    }
  }

  const nextRoutes = [...routes, ...additions]
  const routesWithAlternates = locales ? nextRoutes.map(route => withAlternates(route, nextRoutes, locales)) : nextRoutes

  if (!locales) return routesWithAlternates

  return [...routesWithAlternates, ...generateBareAliases(routesWithAlternates, locales)]
}

function buildNavigationFromPagesConfig(routes: ContentRoute[], config?: ClarifyPagesConfig): ClarifyNavigationNode[] {
  if (!config || config === 'FileTree') return buildNavigation(routes)
  return buildNavigationFromConfig(routes, config)
}

export function buildNavigationFromTabsConfig(routes: ContentRoute[], tabs: ClarifyTabsConfig): TabbedNavigation {
  return {
    kind: 'tabbed',
    tabs: tabs.map(tab => {
      const children = buildNavigationFromPagesConfig(routes, tab.pages)
      return {
        type: 'tab',
        path: firstNavigationPath(children),
        title: resolveLocalizedText(tab.tab, '', '') ?? '',
        icon: tab.icon,
        children,
      }
    }),
  }
}

export function buildNavigationFromConfig(routes: ContentRoute[], config: ClarifyPagesGroup[]): ClarifyNavigationNode[] {
  const routeMap = new Map(routes.map(r => [r.path, r]))

  const buildItem = (item: ClarifyPagesItem): ClarifyNavigationNode => {
    if (typeof item !== 'string' && 'group' in item) {
      const children = item.pages.map(buildItem)
      return {
        path: firstNavigationPath(children),
        title: resolveLocalizedText(item.group, '', '') ?? '',
        icon: item.icon,
        children,
      }
    }

      const intent = routeIntentFromPagesItem(item)

      if (intent.kind === 'openapi') {
        const path = openAPIPagePathFromRef(intent.ref, intent.tagFilter, intent.path)
        const route = routeMap.get(path)
        return {
          path,
          title: resolveLocalizedText(intent.title, '', '') ?? route?.meta.title ?? kebabToTitle(path.split('/').pop() ?? intent.ref),
          icon: intent.icon,
          sections: route?.meta.sections ? navigationSections(route.meta.sections) : undefined,
        }
      }

      const path = routePathFromRef(intent.ref, intent.path)
      const route = routeMap.get(path)
      return {
        path: intent.redirect ? normalizePath(intent.redirect) : path,
        title: resolveLocalizedText(intent.title, '', '') ?? route?.meta.title ?? kebabToTitle(path.split('/').pop() ?? intent.ref),
        icon: intent.icon,
        sections: route?.meta.sections ? navigationSections(route.meta.sections) : undefined,
      }
  }

  return config.map(group => {
    const children = group.pages.map(buildItem)

    return {
      path: children[0]?.path ?? '/',
      title: resolveLocalizedText(group.group, '', '') ?? '',
      icon: group.icon,
      children,
    }
  })
}

function localizeNavigationPaths(nodes: ClarifyNavigationNode[], locale: string, locales: ResolvedClarifyLocalesConfig): ClarifyNavigationNode[] {
  return nodes.map(node => ({
    ...node,
    path: localizedRoutePath(node.path, locale, locales),
    children: node.children ? localizeNavigationPaths(node.children, locale, locales) : undefined,
  }))
}

export function buildLocalizedNavigation(routes: ContentRoute[], config: ClarifyPagesConfig | undefined, localesConfig?: ResolvedClarifyLocalesConfig): LocalizedNavigation | undefined {
  if (!localesConfig) return undefined

  const locales: LocalizedNavigation['locales'] = {}
  for (const locale of localesConfig.locales) {
    const localeRoutes = routes.filter(route => route.locale === locale.code)
    locales[locale.code] = buildLocalizedNavigationForLocale(localeRoutes, config, locale.code, localesConfig)
  }

  return { kind: 'localized', locales }
}

function buildLocalizedNavigationForLocale(routes: ContentRoute[], config: ClarifyPagesConfig | undefined, locale: string, locales: ResolvedClarifyLocalesConfig): ClarifyNavigationNode[] {
  if (!config || config === 'FileTree') {
    const baseNavigation = buildNavigation(routes.map(route => ({ ...route, path: route.basePath ?? route.path })))
    return localizeNavigationPaths(baseNavigation, locale, locales)
  }

  const routeMap = new Map(routes.map(route => [route.basePath ?? route.path, route]))
  const buildItem = (item: ClarifyPagesItem): ClarifyNavigationNode => {
    if (typeof item !== 'string' && 'group' in item) {
      const children = item.pages.map(buildItem)
      return {
        path: firstNavigationPath(children),
        title: resolveLocalizedText(item.group, locale, locales.default) ?? '',
        icon: item.icon,
        children,
      }
    }

      const intent = routeIntentFromPagesItem(item)
      const basePath = intent.kind === 'openapi'
        ? openAPIPagePathFromRef(intent.ref, intent.tagFilter, intent.path)
        : routePathFromRef(intent.ref, intent.path)
      const route = routeMap.get(basePath)
      const path = route?.path ?? localizedRoutePath(basePath, locale, locales)
      const redirectPath = intent.kind === 'page' && intent.redirect ? localizedRoutePath(routePathFromRef(intent.redirect), locale, locales) : undefined

      return {
        path: redirectPath ?? path,
        title: resolveLocalizedText(intent.title, locale, locales.default) ?? route?.meta.title ?? kebabToTitle(basePath.split('/').pop() ?? intent.ref),
        icon: intent.icon,
        sections: route?.meta.sections ? navigationSections(route.meta.sections) : undefined,
      }
  }

  return config.map(group => {
    const children = group.pages.map(buildItem)

    return {
      path: children[0]?.path ?? localizedRoutePath('/', locale, locales),
      title: resolveLocalizedText(group.group, locale, locales.default) ?? '',
      icon: group.icon,
      children,
    }
  })
}

export function buildLocalizedNavigationFromTabsConfig(routes: ContentRoute[], tabs: ClarifyTabsConfig, localesConfig?: ResolvedClarifyLocalesConfig): LocalizedTabbedNavigation | undefined {
  if (!localesConfig) return undefined

  const locales: LocalizedTabbedNavigation['locales'] = {}
  for (const locale of localesConfig.locales) {
    const localeRoutes = routes.filter(route => route.locale === locale.code)
    locales[locale.code] = {
      tabs: tabs.map(tab => {
        const children = buildLocalizedNavigationForLocale(localeRoutes, tab.pages, locale.code, localesConfig)
        return {
          type: 'tab',
          path: firstNavigationPath(children),
          title: resolveLocalizedText(tab.tab, locale.code, localesConfig.default) ?? '',
          icon: tab.icon,
          children,
        }
      }),
    }
  }

  return { kind: 'localized-tabbed', locales }
}
