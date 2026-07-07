import { existsSync } from 'node:fs'
import { join, relative } from 'node:path'

import type { ContentRoute, ContentSection, ClarifyNavigationNode, ClarifyPagesConfig, ClarifyPagesGroup, ClarifyPagesItem, ClarifyLocalizedText, ClarifyTabsConfig, LocalizedNavigation, LocalizedTabbedNavigation, ResolvedClarifyI18nConfig, TabbedNavigation } from '../../types.js'
import { syncContentDocumentRoute } from '../content/content-document.js'
import { type ContentProcessor } from '../content/index.js'
import { findMarkdownRoutes } from '../markdown/index.js'
import { findOpenAPIRoutes, prepareOpenAPIRoutes } from '../openapi/index.js'

export type FindContentRoutesOptions = {
  contentProcessor?: ContentProcessor
}

export function kebabToTitle(str: string): string {
  return str
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export { extractMdxSections } from '../markdown/index.js'

function navigationSections(sections: ContentSection[]) {
  return sections.map(s => ({ id: s.id, title: s.title, level: s.level, badge: s.badge, tags: s.tags }))
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

export function openAPITagsPathSegment(tags: string[]): string {
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

export function routePathFromFilePath(filePath: string, base: string = filePath): string {
  const relativePath = relative(base, filePath)
  const path = '/' + relativePath
    .replace(/\.(mdx?|openapi\.(json|yaml|yml))$/, '')
    .split('/')
    .map(part => part === 'index' ? '' : part)
    .filter(Boolean)
    .join('/')
  return normalizePath(path)
}

export function virtualModuleIdFromRef(ref: string): string {
  return 'virtual:clarify-page/' + ref
    .replace(/\.mdx?$/, '')
    .replace(/\.openapi\.(json|yaml|yml)$/, '')
    .replace(/\/+/g, '/')
}

export function virtualModuleIdFromFilePath(filePath: string, base: string = filePath): string {
  return virtualModuleIdFromRef(relative(base, filePath))
}

export function localizedRoutePath(basePath: string, locale: string, _i18n: ResolvedClarifyI18nConfig): string {
  const normalizedBasePath = normalizePath(basePath)
  const prefix = normalizePath(locale)
  return normalizedBasePath === '/' ? prefix : normalizePath(`${prefix}${normalizedBasePath}`)
}

export function resolveLocalizedText(text: ClarifyLocalizedText | undefined, locale: string, fallbackLocale?: string): string | undefined {
  if (typeof text === 'string') return text
  if (text === undefined) return undefined
  return text[locale] ?? (fallbackLocale ? text[fallbackLocale] : undefined) ?? Object.values(text)[0]
}

export async function findContentRoutes(dir: string, base: string = dir, options: FindContentRoutesOptions = {}): Promise<ContentRoute[]> {
  if (!existsSync(dir)) return []

  const markdownRoutes = await findMarkdownRoutes(dir, base, options)
  const openapiRoutes = findOpenAPIRoutes(dir, base)
  return prepareOpenAPIRoutes([...markdownRoutes, ...openapiRoutes], options.contentProcessor)
}

function virtualModuleIdForLocalizedRoute(contentRoot: string, filePath: string): string {
  return 'virtual:clarify-page/' + relative(contentRoot, filePath)
    .replace(/\.mdx?$/, '')
    .replace(/\.openapi\.(json|yaml|yml)$/, '')
    .replace(/\/+/g, '/')
}

export function withAlternates(route: ContentRoute, routes: ContentRoute[], i18n: ResolvedClarifyI18nConfig): ContentRoute {
  const basePath = route.basePath ?? route.path
  const routeByLocaleAndBase = new Map(
    routes
      .filter(r => !r.locale || r.path === `/${r.locale}` || r.path.startsWith(`/${r.locale}/`))
      .map(r => [`${r.locale ?? ''}:${r.basePath ?? r.path}`, r]),
  )
  const alternates = Object.fromEntries(
    i18n.locales.flatMap((locale) => {
      const alternate = routeByLocaleAndBase.get(`${locale.code}:${basePath}`)
      return alternate ? [[locale.code, alternate.path]] : []
    }),
  )
  return { ...route, alternates }
}

export async function findLocalizedContentRoutes(contentRoot: string, i18n?: ResolvedClarifyI18nConfig, options: FindContentRoutesOptions = {}): Promise<ContentRoute[]> {
  if (!i18n) return findContentRoutes(contentRoot, contentRoot, options)

  const localizedRoutes: ContentRoute[] = []
  for (const locale of i18n.locales) {
    const localeRoot = join(contentRoot, locale.code)
    const discovered = await findContentRoutes(localeRoot, localeRoot, options)
    for (const route of discovered) {
      const basePath = route.basePath ?? route.path
      const localizedRoute: ContentRoute = {
        ...route,
        path: localizedRoutePath(basePath, locale.code, i18n),
        basePath,
        locale: locale.code,
        virtualModuleId: virtualModuleIdForLocalizedRoute(contentRoot, route.filePath),
      }
      localizedRoute.document = syncContentDocumentRoute(localizedRoute)
      localizedRoutes.push(localizedRoute)
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
        const localizedRoute: ContentRoute = {
          ...sourceRoute,
          path: localizedRoutePath(basePath, locale.code, i18n),
          locale: locale.code,
          isFallback: true,
        }
        localizedRoute.document = syncContentDocumentRoute(localizedRoute)
        localizedRoutes.push(localizedRoute)
      }
    }
  }

  const routesWithAlternates = localizedRoutes.map(route => withAlternates(route, localizedRoutes, i18n))

  const bareRoutes: ContentRoute[] = []
  const seenBare = new Set(routesWithAlternates.map(r => r.path))
  for (const route of routesWithAlternates) {
    if (route.locale !== i18n.defaultLocale) continue
    const bp = route.basePath ?? route.path
    if (bp === route.path || seenBare.has(bp)) continue
    seenBare.add(bp)
    const bareRoute: ContentRoute = { ...route, path: bp }
    bareRoute.document = syncContentDocumentRoute(bareRoute)
    bareRoutes.push(bareRoute)
  }

  return [...routesWithAlternates, ...bareRoutes]
}

export function buildNavigation(routes: ContentRoute[]): ClarifyNavigationNode[] {
  const root: ClarifyNavigationNode[] = []

  for (const route of routes) {
    if (route.path === '/' || (route.basePath ?? route.path) === '/404') continue

    const parts = route.path.replace(/^\//, '').split('/')
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const pathSoFar = '/' + parts.slice(0, i + 1).join('/')
      let node = current.find(n => n.path === pathSoFar)
      if (!node) {
        const title = i === parts.length - 1 ? (route.document?.route?.title ?? route.title) : kebabToTitle(parts[i])
        node = { path: pathSoFar, title, children: [] }
        current.push(node)
      }
      if (i === parts.length - 1 && route.document?.metadata.sections) {
        node.sections = navigationSections(route.document.metadata.sections as ContentSection[])
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
  item: ClarifyPagesItem,
): { pageRef?: string; openapiRef?: string; openapiTagFilter?: string[]; path?: string; redirect?: string; title?: ClarifyLocalizedText; icon?: string } {
  if (typeof item === 'string') return { pageRef: item }
  if ('openapi' in item) return { openapiRef: item.openapi, openapiTagFilter: item.filter?.tags, path: item.path, title: item.title, icon: item.icon }
  return { pageRef: item.page, path: item.path, redirect: item.redirect, title: item.title, icon: item.icon }
}

function firstNavigationPath(nodes: ClarifyNavigationNode[]): string {
  for (const node of nodes) {
    if (node.path) return node.path
    const childPath = node.children ? firstNavigationPath(node.children) : undefined
    if (childPath) return childPath
  }
  return '/'
}

function collectExplicitPagePathItems(tabs?: ClarifyTabsConfig): Array<{ pageRef?: string; openapiRef?: string; path?: string; filterTags?: string[] }> {
  const items: Array<{ pageRef?: string; openapiRef?: string; path?: string; filterTags?: string[] }> = []

  for (const tab of tabs ?? []) {
    if (!tab.pages || tab.pages === 'FileTree') continue
    for (const group of tab.pages) {
      for (const item of group.pages) {
        if (typeof item === 'string') continue
        if ('page' in item && item.path) {
          items.push({ pageRef: item.page, path: item.path })
        } else if ('openapi' in item && (item.path || item.filter?.tags?.length)) {
          items.push({ openapiRef: item.openapi, path: item.path, filterTags: item.filter?.tags?.filter(Boolean) })
        }
      }
    }
  }

  return items
}

export function applyConfiguredPageRoutePaths(routes: ContentRoute[], tabs?: ClarifyTabsConfig, i18n?: ResolvedClarifyI18nConfig): ContentRoute[] {
  const pageItems = collectExplicitPagePathItems(tabs)
  if (!pageItems.length) return routes

  const additions: ContentRoute[] = []
  const existingKeys = new Set(routes.map(route => `${route.locale ?? ''}:${route.basePath ?? route.path}`))

  for (const item of pageItems) {
    const sourceBasePath = item.pageRef ? routePathFromRef(item.pageRef) : item.openapiRef ? openAPIPagePathFromRef(item.openapiRef) : undefined
    const targetBasePath = item.pageRef
      ? routePathFromRef(item.pageRef, item.path)
      : item.openapiRef
        ? openAPIPagePathFromRef(item.openapiRef, item.filterTags, item.path)
        : undefined
    if (!sourceBasePath || !targetBasePath || sourceBasePath === targetBasePath) continue

    for (const route of routes) {
      const matches = item.pageRef
        ? route.kind !== 'openapi' && (route.basePath ?? route.path) === sourceBasePath
        : route.kind === 'openapi' && (route.basePath ?? route.path) === sourceBasePath
      if (!matches) continue

      const key = `${route.locale ?? ''}:${targetBasePath}`
      if (existingKeys.has(key)) continue
      existingKeys.add(key)

      const addition: ContentRoute = {
        ...route,
        path: route.locale && i18n ? localizedRoutePath(targetBasePath, route.locale, i18n) : targetBasePath,
        basePath: targetBasePath,
        virtualModuleId: route.virtualModuleId,
        openapi: {
          ...route.openapi,
          tagFilter: item.openapiRef ? item.filterTags : route.openapi?.tagFilter,
        },
      }
      addition.document = syncContentDocumentRoute(addition)
      additions.push(addition)
    }
  }

  const nextRoutes = [...routes, ...additions]
  const routesWithAlternates = i18n ? nextRoutes.map(route => withAlternates(route, nextRoutes, i18n)) : nextRoutes

  if (!i18n) return routesWithAlternates

  const bareRoutes: ContentRoute[] = []
  const seenBare = new Set(routesWithAlternates.map(r => r.path))
  for (const route of routesWithAlternates) {
    if (route.locale !== i18n.defaultLocale) continue
    const bp = route.basePath ?? route.path
    if (bp === route.path || seenBare.has(bp)) continue
    seenBare.add(bp)
    const bareRoute: ContentRoute = { ...route, path: bp }
    bareRoute.document = syncContentDocumentRoute(bareRoute)
    bareRoutes.push(bareRoute)
  }

  return [...routesWithAlternates, ...bareRoutes]
}

function buildNavigationFromPagesConfig(routes: ContentRoute[], config?: ClarifyPagesConfig, locale?: string): ClarifyNavigationNode[] {
  if (!config || config === 'FileTree') return buildNavigation(routes)
  return buildNavigationFromConfig(routes, config, locale)
}

export function buildNavigationFromTabsConfig(routes: ContentRoute[], tabs: ClarifyTabsConfig, locale?: string): TabbedNavigation {
  return {
    tabs: tabs.map(tab => {
      const children = buildNavigationFromPagesConfig(routes, tab.pages, locale)
      return {
        type: 'tab',
        path: firstNavigationPath(children),
        title: resolveLocalizedText(tab.tab, locale ?? '', locale) ?? '',
        icon: tab.icon,
        children,
      }
    }),
  }
}

export function buildNavigationFromConfig(routes: ContentRoute[], config: ClarifyPagesGroup[], locale?: string): ClarifyNavigationNode[] {
  const routeMap = new Map(routes.map(r => [r.path, r]))

  return config.map(group => {
    const children = group.pages.map(item => {
      const { pageRef, openapiRef, openapiTagFilter, path: explicitPath, redirect, title, icon } = resolvePageItem(item)

      if (openapiRef) {
        const path = openAPIPagePathFromRef(openapiRef, openapiTagFilter, explicitPath)
        const route = routeMap.get(path)
        return {
          path,
          title: resolveLocalizedText(title, locale ?? '', locale) ?? route?.document?.route?.title ?? route?.title ?? kebabToTitle(path.split('/').pop() ?? openapiRef),
          icon,
          sections: route?.document?.metadata.sections ? navigationSections(route.document.metadata.sections as ContentSection[]) : undefined,
        }
      }

      const ref = pageRef ?? ''
      const path = routePathFromRef(ref, explicitPath)
      const route = routeMap.get(path)
      return {
        path: redirect ? normalizePath(redirect) : path,
        title: resolveLocalizedText(title, locale ?? '', locale) ?? route?.document?.route?.title ?? route?.title ?? kebabToTitle(path.split('/').pop() ?? ref),
        icon,
        sections: route?.document?.metadata.sections ? navigationSections(route.document.metadata.sections as ContentSection[]) : undefined,
      }
    })

    return {
      path: children[0]?.path ?? '/',
      title: resolveLocalizedText(group.group, locale ?? '', locale) ?? '',
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
    const localizedRoutes = routes.filter(route => route.locale === locale.code)
    const localizedNavigation = buildNavigationFromConfig(localizedRoutes, Array.isArray(config) ? config : [], locale.code)
    result[locale.code] = localizeNavigationPaths(localizedNavigation, locale.code, i18n)
  }

  return result
}

export function buildLocalizedNavigationFromTabsConfig(routes: ContentRoute[], tabs: ClarifyTabsConfig, i18n: ResolvedClarifyI18nConfig): LocalizedTabbedNavigation | undefined {
  if (!i18n) return undefined

  const result: LocalizedTabbedNavigation = {}
  for (const locale of i18n.locales) {
    const localizedRoutes = routes.filter(route => route.locale === locale.code)
    const localizedNavigation = buildNavigationFromTabsConfig(localizedRoutes, tabs, locale.code)
    result[locale.code] = {
      tabs: localizedNavigation.tabs.map(tab => ({
        type: 'tab',
        path: localizedRoutePath(tab.path, locale.code, i18n),
        title: tab.title,
        icon: tab.icon,
        children: localizeNavigationPaths(tab.children, locale.code, i18n),
      })),
    }
  }

  return result
}
