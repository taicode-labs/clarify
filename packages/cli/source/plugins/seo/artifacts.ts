import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { ContentRoute, ResolvedProjectConfig } from '../../types.js'

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function normalizeRoutePrefix(routePrefix: string): string {
  if (!routePrefix || routePrefix === '/') return ''
  return `/${routePrefix.replace(/^\/+|\/+$/g, '')}`
}

function routeUrl(siteUrl: string, routePrefix: string, routePath: string): string {
  const base = trimTrailingSlash(siteUrl)
  const prefix = normalizeRoutePrefix(routePrefix)
  const path = routePath === '/' ? '' : routePath.replace(/^\/+/, '/')
  return `${base}${prefix}${path}` || base
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function publicRoutes(routes: ContentRoute[]): ContentRoute[] {
  return routes.filter(route => route.path !== '/404')
}

export function createSitemapXml(routes: ContentRoute[], config: ResolvedProjectConfig): string | undefined {
  if (!config.siteUrl) return undefined

  const urls = publicRoutes(routes)
    .map(route => routeUrl(config.siteUrl!, config.routePrefix, route.path))
    .filter((url, index, list) => list.indexOf(url) === index)
    .sort()

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(url => `  <url><loc>${escapeXml(url)}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n')
}

export function createRobotsTxt(config: ResolvedProjectConfig): string | undefined {
  if (!config.siteUrl) return undefined
  const sitemapUrl = routeUrl(config.siteUrl, config.routePrefix, '/sitemap.xml')
  return [
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${sitemapUrl}`,
    '',
  ].join('\n')
}

export async function writeSeoFiles(outputRoot: string, routes: ContentRoute[], config: ResolvedProjectConfig): Promise<void> {
  const sitemap = createSitemapXml(routes, config)
  const robots = createRobotsTxt(config)
  if (!sitemap || !robots) return

  await mkdir(outputRoot, { recursive: true })
  await Promise.all([
    writeFile(join(outputRoot, 'sitemap.xml'), sitemap, 'utf-8'),
    writeFile(join(outputRoot, 'robots.txt'), robots, 'utf-8'),
  ])
}
