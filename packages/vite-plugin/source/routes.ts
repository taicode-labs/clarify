import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

import SwaggerParser from '@apidevtools/swagger-parser'
import GithubSlugger, { slug } from 'github-slugger'
import { toString } from 'mdast-util-to-string'
import { remark } from 'remark'
import { visit } from 'unist-util-visit'

import { extractFrontmatter } from './frontmatter.js'
import type { ContentRoute, ContentSection, OpenAPISpec, ClarifyNavigationNode, ClarifyPagesGroup, ClarifyPagesItem } from './types.js'

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

const OPENAPI_HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const

function navigationSections(sections: ContentSection[]) {
  return sections.map(s => ({ id: s.id, title: s.title, tags: s.tags }))
}

/** 从 OpenAPI spec 中提取接口列表作为章节 */
export function extractOpenAPISections(spec: OpenAPISpec): ContentSection[] {
  const sections: ContentSection[] = []
  const paths = spec.paths ?? {}
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue
    for (const method of OPENAPI_HTTP_METHODS) {
      const op = pathItem[method]
      if (!op) continue
      const title = op.summary ?? `${method.toUpperCase()} ${path}`
      sections.push({ id: slug(`${method} ${path}`), title, level: 2, tags: [method.toUpperCase()] })
    }
  }
  return sections
}

export async function readOpenAPISpec(filePath: string): Promise<OpenAPISpec | null> {
  try {
    return await SwaggerParser.dereference(filePath) as OpenAPISpec
  } catch {
    return null
  }
}

function resolveOpenAPIPath(filePath: string, base: string): string {
  const relativePath = relative(base, filePath)
  const pathParts = relativePath
    .replace(/\.openapi\.(json|yaml|yml)$/, '')
    .split('/')
  const path = '/' + pathParts.map(p => p === 'index' ? '' : p).filter(Boolean).join('/')
  return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
}

export function findContentRoutes(dir: string, base: string = dir): ContentRoute[] {
  const routes: ContentRoute[] = []
  if (!existsSync(dir)) return routes

  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      routes.push(...findContentRoutes(fullPath, base))
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      const relativePath = relative(base, fullPath)
      const pathParts = relativePath.replace(/\.mdx$/, '').split('/')
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
        filePath: fullPath,
        virtualModuleId: 'virtual:clarify-page/' + relativePath.replace(/\.mdx$/, '').replace(/\/+/g, '/'),
        title,
        kind: 'mdx',
        sections: extractMdxSections(content),
      })
    } else if (entry.isFile() && /\.openapi\.(json|yaml|yml)$/.test(entry.name)) {
      const cleanPath = resolveOpenAPIPath(fullPath, base)
      const title = kebabToTitle(cleanPath.split('/').pop() ?? 'API')

      routes.push({
        path: cleanPath,
        filePath: fullPath,
        virtualModuleId: 'virtual:clarify-page/' + relative(base, fullPath).replace(/\.openapi\.(json|yaml|yml)$/, '').replace(/\/+/g, '/'),
        title,
        kind: 'openapi',
      })
    }
  }
  return routes
}

/** @deprecated Use findContentRoutes instead */
export function findMdxFiles(dir: string, base: string = dir): ContentRoute[] {
  return findContentRoutes(dir, base).filter(r => r.kind === 'mdx')
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
): { pageRef?: string; openapiRef?: string; redirect?: string; title?: string } {
  if (typeof item === 'string') return { pageRef: item }
  if ('openapi' in item) return { openapiRef: item.openapi, title: item.title }
  return { pageRef: item.page, redirect: item.redirect }
}

export function buildNavigationFromConfig(routes: ContentRoute[], config: ClarifyPagesGroup[]): ClarifyNavigationNode[] {
  const routeMap = new Map(routes.map(r => [r.path, r]))

  return config.map(group => {
    const children = group.pages.map(item => {
      const { pageRef, openapiRef, redirect, title } = resolvePageItem(item)

      if (openapiRef) {
        const path = '/' + openapiRef.replace(/\.openapi\.(json|yaml|yml)$/, '')
        const route = routeMap.get(path)
        return {
          path,
          title: title ?? route?.title ?? kebabToTitle(path.split('/').pop() ?? openapiRef),
          sections: route?.sections ? navigationSections(route.sections) : undefined,
        }
      }

      const ref = pageRef ?? ''
      const path = ref === 'index' ? '/' : '/' + ref
      const route = routeMap.get(path)
      return {
        path: redirect ? redirect : path,
        title: route?.title ?? kebabToTitle(path.split('/').pop() ?? ref),
        sections: route?.sections ? navigationSections(route.sections) : undefined,
      }
    })

    return {
      path: children[0]?.path ?? '/',
      title: group.group,
      children,
    }
  })
}
