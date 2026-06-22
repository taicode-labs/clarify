import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

import GithubSlugger from 'github-slugger'
import { toString } from 'mdast-util-to-string'
import { remark } from 'remark'
import { visit } from 'unist-util-visit'

import type { ContentRoute, ContentSection, ClarifyNavigationNode, ClarifyPagesConfig, ClarifyPagesGroup, ClarifyPagesItem, ClarifyLocalizedText, ClarifyTabsConfig, LocalizedNavigation, LocalizedTabbedNavigation, ResolvedClarifyI18nConfig, TabbedNavigation } from '../types.js'

import { parseFrontmatter } from './frontmatter.js'

function kebabToTitle(str: string): string {
  return str
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function parseMdxTree(content: string) {
  return remark.parse(content)
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
export function extractMdxSections(content: string): ContentSection[] {
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

function navigationSections(sections: ContentSection[]) {
  return sections.map(s => ({ id: s.id, title: s.title, badge: s.badge, tags: s.tags }))
}

function normalizePath(path: string): string {
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

export function openAPITagsPathSegment(tags: string[]): string {
  return tags.map(pathSegmentFromOpenAPITag).join('-')
}

export function basePathFromRef(ref: string): string {
  const withoutExtension = ref.replace(/\.mdx?$/, '').replace(/\.openapi\.(json|yaml|yml)$/, '')
  return normalizePath(withoutExtension === 'index' ? '/' : withoutExtension.replace(/\/index$/, ''))
}

export function openAPIPagePathFromRef(ref: string, tagFilter?: string[]): string {
  const basePath = basePathFromRef(ref)
  if (!tagFilter?.length) return basePath
  return normalizePath(`${basePath}/${openAPITagsPathSegment(tagFilter)}`)
}

export function routePathFromRef(ref: string): string {
  return basePathFromRef(ref)
}

export function virtualModuleIdFromRef(ref: string): string {
  return 'virtual:clarify-page/' + ref
    .replace(/\.mdx?$/, '')
    .replace(/\.openapi\.(json|yaml|yml)$/, '')
    .replace(/\/+/g, '/')
}

export function localizedRoutePath(basePath: string, locale: string, i18n: ResolvedClarifyI18nConfig): string {
  const normalizedBasePath = normalizePath(basePath)
  if (locale === i18n.defaultLocale) return normalizedBasePath
  const prefix = normalizePath(locale)
  return normalizedBasePath === '/' ? prefix : normalizePath(`${prefix}${normalizedBasePath}`)
}

export function resolveLocalizedText(text: ClarifyLocalizedText | undefined, locale: string, fallbackLocale?: string): string | undefined {
  if (typeof text === 'string' || text === undefined) return text
  return text[locale] ?? (fallbackLocale ? text[fallbackLocale] : undefined) ?? Object.values(text)[0]
}

export function findContentRoutes(dir: string, base: string = dir): ContentRoute[] {
  const routes: ContentRoute[] = []
  if (!existsSync(dir)) return routes

  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      routes.push(...findContentRoutes(fullPath, base))
    } else if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
      const relativePath = relative(base, fullPath)
      const pathParts = relativePath.replace(/\.mdx?$/, '').split('/')
      const path = '/' + pathParts.map(p => p === 'index' ? '' : p).filter(Boolean).join('/')
      const cleanPath = path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'

      const source = readFileSync(fullPath, 'utf-8')
      const { frontmatter, content } = parseFrontmatter(source)

      let title = typeof frontmatter.title === 'string' ? frontmatter.title : ''
      if (!title) {
        const lastPart = pathParts[pathParts.length - 1] ?? ''
        const stem = lastPart === 'index'
          ? (pathParts.length >= 2 ? pathParts[pathParts.length - 2]! : extractH1(content))
          : lastPart
        title = kebabToTitle(stem) || 'Untitled'
      }

      routes.push({
        path: cleanPath,
        basePath: cleanPath,
        filePath: fullPath,
        virtualModuleId: 'virtual:clarify-page/' + relativePath.replace(/\.mdx?$/, '').replace(/\/+/g, '/'),
        title,
        description: typeof frontmatter.description === 'string' ? frontmatter.description : undefined,
        keywords: frontmatterKeywords(frontmatter),
        kind: 'mdx',
        frontmatter,
        content,
        sections: extractMdxSections(content),
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

function withAlternates(route: ContentRoute, routes: ContentRoute[], i18n: ResolvedClarifyI18nConfig): ContentRoute {
  const basePath = route.basePath ?? route.path
  const routeByLocaleAndBase = new Map(routes.map(route => [`${route.locale ?? ''}:${route.basePath ?? route.path}`, route]))
  const alternates = Object.fromEntries(
    i18n.locales.flatMap((locale) => {
      const alternate = routeByLocaleAndBase.get(`${locale.code}:${basePath}`)
      return alternate ? [[locale.code, alternate.path]] : []
    })
  )
  return { ...route, alternates }
}

export function findLocalizedContentRoutes(contentRoot: string, i18n?: ResolvedClarifyI18nConfig): ContentRoute[] {
  if (!i18n) return findContentRoutes(contentRoot)

  const localizedRoutes: ContentRoute[] = []
  for (const locale of i18n.locales) {
    const localeRoot = join(contentRoot, locale.code)
    const discovered = findContentRoutes(localeRoot)
    for (const route of discovered) {
      const basePath = route.basePath ?? route.path
      localizedRoutes.push({
        ...route,
        path: localizedRoutePath(basePath, locale.code, i18n),
        basePath,
        locale: locale.code,
        virtualModuleId: virtualModuleIdForLocalizedRoute(contentRoot, route.filePath),
      })
    }
  }

  if (i18n.missing === 'fallback') {
    const routeByLocaleAndBase = new Map(localizedRoutes.map(route => [`${route.locale ?? ''}:${route.basePath ?? route.path}`, route]))
    const defaultRoutes = localizedRoutes.filter(route => route.locale === i18n.defaultLocale)
    for (const sourceRoute of defaultRoutes) {
      const basePath = sourceRoute.basePath ?? sourceRoute.path
      for (const locale of i18n.locales) {
        const key = `${locale.code}:${basePath}`
        if (routeByLocaleAndBase.has(key)) continue
        localizedRoutes.push({
          ...sourceRoute,
          path: localizedRoutePath(basePath, locale.code, i18n),
          locale: locale.code,
          isFallback: true,
        })
      }
    }
  }

  return localizedRoutes.map(route => withAlternates(route, localizedRoutes, i18n))
}

export function buildNavigation(routes: ContentRoute[]): ClarifyNavigationNode[] {
  const root: ClarifyNavigationNode[] = []

  for (const route of routes) {
    if (route.path === '/') continue // 首页不放入侧边栏

    const parts = route.path.replace(/^\//, '').split('/')
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const pathSoFar = '/' + parts.slice(0, i + 1).join('/')
      let node = current.find(n => n.path === pathSoFar)
      if (!node) {
        node = { path: pathSoFar, title: i === parts.length - 1 ? route.title : kebabToTitle(parts[i]), children: [] }
        current.push(node)
      }
      if (i === parts.length - 1 && route.sections) {
        node.sections = navigationSections(route.sections)
      }
      if (i < parts.length - 1) {
        node.children = node.children ?? []
        current = node.children
      }
    }
  }

  return root
}

function resolvePageItem(
  item: ClarifyPagesItem
): { pageRef?: string; openapiRef?: string; openapiTagFilter?: string[]; redirect?: string; title?: ClarifyLocalizedText; icon?: string } {
  if (typeof item === 'string') return { pageRef: item }
  if ('openapi' in item) return { openapiRef: item.openapi, openapiTagFilter: item.filter?.tags, title: item.title, icon: item.icon }
  return { pageRef: item.page, redirect: item.redirect, title: item.title, icon: item.icon }
}

function firstNavigationPath(nodes: ClarifyNavigationNode[]): string {
  for (const node of nodes) {
    if (node.path) return node.path
    const childPath = node.children ? firstNavigationPath(node.children) : undefined
    if (childPath) return childPath
  }
  return '/'
}

function buildNavigationFromPagesConfig(routes: ContentRoute[], config?: ClarifyPagesConfig): ClarifyNavigationNode[] {
  if (!config || config === 'FileTree') return buildNavigation(routes)
  return buildNavigationFromConfig(routes, config)
}

export function buildNavigationFromTabsConfig(routes: ContentRoute[], tabs: ClarifyTabsConfig): TabbedNavigation {
  return {
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

  return config.map(group => {
    const children = group.pages.map(item => {
      const { pageRef, openapiRef, openapiTagFilter, redirect, title, icon } = resolvePageItem(item)

      if (openapiRef) {
        const path = openAPIPagePathFromRef(openapiRef, openapiTagFilter)
        const route = routeMap.get(path)
        return {
          path,
          title: resolveLocalizedText(title, '', '') ?? route?.title ?? kebabToTitle(path.split('/').pop() ?? openapiRef),
          icon,
          sections: route?.sections ? navigationSections(route.sections) : undefined,
        }
      }

      const ref = pageRef ?? ''
      const path = ref === 'index' ? '/' : '/' + ref
      const route = routeMap.get(path)
      return {
        path: redirect ? redirect : path,
        title: resolveLocalizedText(title, '', '') ?? route?.title ?? kebabToTitle(path.split('/').pop() ?? ref),
        icon,
        sections: route?.sections ? navigationSections(route.sections) : undefined,
      }
    })

    return {
      path: children[0]?.path ?? '/',
      title: resolveLocalizedText(group.group, '', '') ?? '',
      icon: group.icon,
      children,
    }
  })
}

function localizeNavigationPaths(nodes: ClarifyNavigationNode[], locale: string, i18n: ResolvedClarifyI18nConfig): ClarifyNavigationNode[] {
  return nodes.map(node => ({
    ...node,
    path: localizedRoutePath(node.path, locale, i18n),
    children: node.children ? localizeNavigationPaths(node.children, locale, i18n) : undefined,
  }))
}

export function buildLocalizedNavigation(routes: ContentRoute[], config: ClarifyPagesConfig | undefined, i18n?: ResolvedClarifyI18nConfig): LocalizedNavigation | undefined {
  if (!i18n) return undefined

  const result: LocalizedNavigation = {}
  for (const locale of i18n.locales) {
    const localeRoutes = routes.filter(route => route.locale === locale.code)
    result[locale.code] = buildLocalizedNavigationForLocale(localeRoutes, config, locale.code, i18n)
  }

  return result
}

function buildLocalizedNavigationForLocale(routes: ContentRoute[], config: ClarifyPagesConfig | undefined, locale: string, i18n: ResolvedClarifyI18nConfig): ClarifyNavigationNode[] {
  if (!config || config === 'FileTree') {
    const baseNavigation = buildNavigation(routes.map(route => ({ ...route, path: route.basePath ?? route.path })))
    return localizeNavigationPaths(baseNavigation, locale, i18n)
  }

  const routeMap = new Map(routes.map(route => [route.basePath ?? route.path, route]))
  return config.map(group => {
    const children = group.pages.map(item => {
      const { pageRef, openapiRef, openapiTagFilter, redirect, title, icon } = resolvePageItem(item)
      const ref = openapiRef ?? pageRef ?? ''
      const basePath = openapiRef ? openAPIPagePathFromRef(openapiRef, openapiTagFilter) : basePathFromRef(ref)
      const route = routeMap.get(basePath)
      const path = route?.path ?? localizedRoutePath(basePath, locale, i18n)
      const redirectPath = redirect ? localizedRoutePath(basePathFromRef(redirect), locale, i18n) : undefined

      return {
        path: redirectPath ?? path,
        title: resolveLocalizedText(title, locale, i18n.defaultLocale) ?? route?.title ?? kebabToTitle(basePath.split('/').pop() ?? ref),
        icon,
        sections: route?.sections ? navigationSections(route.sections) : undefined,
      }
    })

    return {
      path: children[0]?.path ?? localizedRoutePath('/', locale, i18n),
      title: resolveLocalizedText(group.group, locale, i18n.defaultLocale) ?? '',
      icon: group.icon,
      children,
    }
  })
}

export function buildLocalizedNavigationFromTabsConfig(routes: ContentRoute[], tabs: ClarifyTabsConfig, i18n?: ResolvedClarifyI18nConfig): LocalizedTabbedNavigation | undefined {
  if (!i18n) return undefined

  const result: LocalizedTabbedNavigation = {}
  for (const locale of i18n.locales) {
    const localeRoutes = routes.filter(route => route.locale === locale.code)
    result[locale.code] = {
      tabs: tabs.map(tab => {
        const children = buildLocalizedNavigationForLocale(localeRoutes, tab.pages, locale.code, i18n)
        return {
          type: 'tab',
          path: firstNavigationPath(children),
          title: resolveLocalizedText(tab.tab, locale.code, i18n.defaultLocale) ?? '',
          icon: tab.icon,
          children,
        }
      }),
    }
  }

  return result
}
