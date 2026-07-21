import { isAbsolute, relative } from 'node:path'

const PAGE_PREFIX = 'virtual:clarify-page/'
const CONTENT_PREFIX = 'virtual:clarify-content/'

export function pageVirtualModuleId(path: string): string {
  const normalized = path
    .replace(/^\/+/, '')
    .replace(/\/index$/, '')
    .replace(/\/+/g, '/')
  return `${PAGE_PREFIX}${normalized || 'index'}`
}

export function pageVirtualModuleIdFromRef(ref: string): string {
  return pageVirtualModuleId(ref
    .replace(/\.mdx?$/, '')
    .replace(/\.openapi\.(json|yaml|yml)$/, ''))
}

export function isPageVirtualModuleId(id: string): boolean {
  return id.startsWith(PAGE_PREFIX)
}

export function pageVirtualModulePath(id: string): string {
  return isPageVirtualModuleId(id) ? id.slice(PAGE_PREFIX.length) : id
}

export function contentVirtualModuleId(filePath: string, contentRoot: string): string {
  const sourcePath = relative(contentRoot, filePath).replace(/\\/g, '/')
  if (!sourcePath || sourcePath.startsWith('../') || isAbsolute(sourcePath)) {
    throw new Error(`Content source must be inside the content root: ${filePath}`)
  }
  return `${CONTENT_PREFIX}${sourcePath}`
}
