import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

import { extractFrontmatter } from './frontmatter.js'
import type { MdxRoute, ResolvedClarifyOptions, ClarifyNavigationNode, ClarifyNavigationConfig } from './types.js'

function kebabToTitle(str: string): string {
  return str
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** 从内容中提取第一个 H1 标题 */
function extractH1(content: string): string {
  const match = content.match(/^\s*#\s+(.+)$/m)
  return match ? match[1].trim() : ''
}

export function findMdxFiles(dir: string, base: string = dir): MdxRoute[] {
  const routes: MdxRoute[] = []
  if (!existsSync(dir)) return routes

  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      routes.push(...findMdxFiles(fullPath, base))
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      const relativePath = relative(base, fullPath)
      const pathParts = relativePath.replace(/\.mdx$/, '').split('/')
      const path = '/' + pathParts.map(p => p === 'index' ? '' : p).filter(Boolean).join('/')
      const cleanPath = path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'

      const content = readFileSync(fullPath, 'utf-8')
      const frontmatter = extractFrontmatter(content)

      let title = frontmatter.title
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
      })
    }
  }
  return routes
}

export function buildNavigation(routes: MdxRoute[]): ClarifyNavigationNode[] {
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
      if (i < parts.length - 1) {
        node.children = node.children ?? []
        current = node.children
      }
    }
  }

  return root
}

export function generateConfigModule(config: ResolvedClarifyOptions): string {
  return `export const config = ${JSON.stringify(config)};`
}

export function buildNavigationFromConfig(
  routes: MdxRoute[],
  config: ClarifyNavigationConfig
): ClarifyNavigationNode[] {
  const routeMap = new Map(routes.map(r => [r.path, r]))

  return config.map(group => {
    const children = group.pages.map(pageRef => {
      const path = pageRef === 'index' ? '/' : '/' + pageRef
      const route = routeMap.get(path)
      return {
        path,
        title: route?.title ?? kebabToTitle(path.split('/').pop() ?? pageRef),
      }
    })

    return {
      path: children[0]?.path ?? '/',
      title: group.group,
      children,
    }
  })
}

export function generateRoutesModule(routes: MdxRoute[], navigationConfig?: ClarifyNavigationConfig): string {
  const imports = routes.map((r, i) => `import Page${i} from '${r.virtualModuleId}';`).join('\n')
  const routesArray = routes.map((r, i) => `  { path: ${JSON.stringify(r.path)}, title: ${JSON.stringify(r.title)}, component: Page${i} }`).join(',\n')

  const navigation = navigationConfig
    ? buildNavigationFromConfig(routes, navigationConfig)
    : buildNavigation(routes)

  return `${imports}\n\nexport const routes = [\n${routesArray}\n];\n\nexport const navigation = ${JSON.stringify(navigation, null, 2)};\n`
}
