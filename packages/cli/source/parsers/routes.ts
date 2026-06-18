import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

import GithubSlugger from 'github-slugger'
import { toString } from 'mdast-util-to-string'
import { remark } from 'remark'
import { visit } from 'unist-util-visit'

import type { ContentRoute, ContentSection, ClarifyNavigationNode, ClarifyPagesGroup, ClarifyPagesItem, ClarifyLocalizedText, LocalizedNavigation, ResolvedClarifyI18nConfig } from '../types.js'

import { extractFrontmatter } from './frontmatter.js'

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

export function basePathFromRef(ref: string): string {
  const withoutExtension = ref.replace(/\.mdx?$/, '').replace(/\.openapi\.(json|yaml|yml)$/, '')
  return normalizePath(withoutExtension === 'index' ? '/' : withoutExtension.replace(/\/index$/, ''))
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

      const content = readFileSync(fullPath, 'utf-8')
      const frontmatter = extractFrontmatter(content)

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
        kind: 'mdx',
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
): { pageRef?: string; openapiRef?: string; redirect?: string; title?: ClarifyLocalizedText; icon?: string } {
  if (typeof item === 'string') return { pageRef: item }
  if ('openapi' in item) return { openapiRef: item.openapi, title: item.title, icon: item.icon }
  return { pageRef: item.page, redirect: item.redirect, title: item.title, icon: item.icon }
}

export function buildNavigationFromConfig(routes: ContentRoute[], config: ClarifyPagesGroup[]): ClarifyNavigationNode[] {
  const routeMap = new Map(routes.map(r => [r.path, r]))

  return config.map(group => {
    const children = group.pages.map(item => {
      const { pageRef, openapiRef, redirect, title, icon } = resolvePageItem(item)

      if (openapiRef) {
        const path = '/' + openapiRef.replace(/\.openapi\.(json|yaml|yml)$/, '')
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

export function buildLocalizedNavigation(routes: ContentRoute[], config: ClarifyPagesGroup[] | 'FileTree' | undefined, i18n?: ResolvedClarifyI18nConfig): LocalizedNavigation | undefined {
  if (!i18n) return undefined

  const result: LocalizedNavigation = {}
  for (const locale of i18n.locales) {
    const localeRoutes = routes.filter(route => route.locale === locale.code)
    if (!config || config === 'FileTree') {
      const baseNavigation = buildNavigation(localeRoutes.map(route => ({ ...route, path: route.basePath ?? route.path })))
      result[locale.code] = localizeNavigationPaths(baseNavigation, locale.code, i18n)
      continue
    }

    const routeMap = new Map(localeRoutes.map(route => [route.basePath ?? route.path, route]))
    result[locale.code] = config.map(group => {
      const children = group.pages.map(item => {
        const { pageRef, openapiRef, redirect, title, icon } = resolvePageItem(item)
        const ref = openapiRef ?? pageRef ?? ''
        const basePath = basePathFromRef(ref)
        const route = routeMap.get(basePath)
        const path = route?.path ?? localizedRoutePath(basePath, locale.code, i18n)
        const redirectPath = redirect ? localizedRoutePath(basePathFromRef(redirect), locale.code, i18n) : undefined

        return {
          path: redirectPath ?? path,
          title: resolveLocalizedText(title, locale.code, i18n.defaultLocale) ?? route?.title ?? kebabToTitle(basePath.split('/').pop() ?? ref),
          icon,
          sections: route?.sections ? navigationSections(route.sections) : undefined,
        }
      })

      return {
        path: children[0]?.path ?? localizedRoutePath('/', locale.code, i18n),
        title: resolveLocalizedText(group.group, locale.code, i18n.defaultLocale) ?? '',
        icon: group.icon,
        children,
      }
    })
  }

  return result
}
