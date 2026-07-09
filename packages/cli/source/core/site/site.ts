import { join, relative } from 'node:path'

import { findContentRoutes, localizedRoutePath, virtualModuleIdFromRef, withAlternates } from '../../parsers/routes/routes.js'
import type { ClarifyPlugin, ContentRoute } from '../../types.js'
import { getProjectContentProcessor } from '../content/content.js'
import { ClarifyContext } from '../engine/context.js'
import { runHooks } from '../plugin/hooks.js'

export async function discoverRoutesForRoot(routeRoot: string, locale: string | undefined, plugins: ClarifyPlugin[], ctx: ClarifyContext): Promise<ContentRoute[]> {
  const discovered = await runHooks(plugins, 'routes:discover', {
    contentRoot: routeRoot,
    locale,
    routes: await findContentRoutes(routeRoot, routeRoot, {
      contentProcessor: getProjectContentProcessor(ctx),
      pageTransform: page => runHooks(plugins, 'page:transform', page, ctx),
    }),
  }, ctx)
  return discovered.routes
}

export async function discoverRoutes(root: string, contentRoot: string, plugins: ClarifyPlugin[], ctx: ClarifyContext): Promise<ContentRoute[]> {
  const i18n = ctx.projectConfig.i18n
  if (!i18n) return discoverRoutesForRoot(contentRoot, undefined, plugins, ctx)

  const localizedRoutes: ContentRoute[] = []
  for (const locale of i18n.locales) {
    const localeRoot = join(contentRoot, locale.code)
    const discovered = await discoverRoutesForRoot(localeRoot, locale.code, plugins, ctx)
    for (const route of discovered) {
      const basePath = route.basePath ?? route.path
      localizedRoutes.push({
        ...route,
        path: localizedRoutePath(basePath, locale.code, i18n),
        basePath,
        locale: locale.code,
        virtualModuleId: virtualModuleIdFromRef(relative(contentRoot, route.filePath)),
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

  const routesWithAlternates = localizedRoutes.map(route => withAlternates(route, localizedRoutes, i18n))

  // 为默认语言生成无前缀的裸路径别名 (/example)，方便不带语言前缀的 URL 也能访问
  // 标记这些别名路由，以便搜索索引生成时过滤它们，避免重复索引
  const defaultLocale = i18n.defaultLocale
  const bareRoutes: ContentRoute[] = []
  const seenBare = new Set(routesWithAlternates.map(r => r.path))
  for (const route of routesWithAlternates) {
    if (route.locale !== defaultLocale) continue
    const bp = route.basePath ?? route.path
    if (bp === route.path || seenBare.has(bp)) continue
    seenBare.add(bp)
    bareRoutes.push({ ...route, path: bp, isBareAlias: true })
  }

  return [...routesWithAlternates, ...bareRoutes]
}
