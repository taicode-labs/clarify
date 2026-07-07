import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

import GithubSlugger from 'github-slugger'
import { toString } from 'mdast-util-to-string'
import { remark } from 'remark'
import { visit } from 'unist-util-visit'

import type { ContentRoute, ContentSection } from '../../types.js'
import { createContentProcessor, type ContentProcessor } from '../content/index.js'
import { kebabToTitle, routePathFromFilePath, virtualModuleIdFromFilePath } from '../router/index.js'

import { createMarkdownContentDocument } from './content-document.js'

export type FindMarkdownRoutesOptions = {
  contentProcessor?: ContentProcessor
}

function parseMdxTree(content: string) {
  return remark.parse(content)
}

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

export async function findMarkdownRoutes(dir: string, base: string = dir, options: FindMarkdownRoutesOptions = {}): Promise<ContentRoute[]> {
  const routes: ContentRoute[] = []
  if (!existsSync(dir)) return routes

  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      routes.push(...await findMarkdownRoutes(fullPath, base, options))
      continue
    }
    if (!entry.isFile() || !/\.mdx?$/.test(entry.name)) continue

    const cleanPath = routePathFromFilePath(fullPath, base)
    const relativePath = relative(base, fullPath)
    const pathParts = relativePath.replace(/\.mdx?$/, '').split('/')

    const source = readFileSync(fullPath, 'utf-8')
    const { frontmatter, content } = await (options.contentProcessor ?? createContentProcessor()).processMdx(source, fullPath)

    let title = typeof frontmatter.title === 'string' ? frontmatter.title : ''
    if (!title) {
      const lastPart = pathParts[pathParts.length - 1] ?? ''
      const stem = lastPart === 'index'
        ? (pathParts.length >= 2 ? pathParts[pathParts.length - 2]! : extractH1(content))
        : lastPart
      title = kebabToTitle(stem) || 'Untitled'
    }

    routes.push({
      kind: 'mdx',
      title,
      path: cleanPath,
      basePath: cleanPath,
      filePath: fullPath,
      virtualModuleId: virtualModuleIdFromFilePath(fullPath, base),
      source: {
        frontmatter,
        content,
      },
      document: createMarkdownContentDocument({ path: cleanPath, title, filePath: fullPath, kind: 'mdx', virtualModuleId: virtualModuleIdFromFilePath(fullPath, base) }, content, {
        description: typeof frontmatter.description === 'string' ? frontmatter.description : undefined,
        keywords: frontmatterKeywords(frontmatter),
        sections: extractMdxSections(content),
        diagnostic: undefined
      }),
    })
  }

  return routes
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
