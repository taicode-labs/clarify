import { join, relative } from 'node:path'

import { applyConfiguredPageRoutePaths, buildLocalizedNavigationFromTabsConfig, buildNavigation, buildNavigationFromTabsConfig, findContentRoutes, localizedRoutePath, virtualModuleIdFromRef } from '../parsers/routes.js'
import type { ClarifyHookContext, ClarifyPlugin, ContentRoute, NavigationTree, ResolvedClarifyI18nConfig } from '../types.js'

import { createBuiltinPlugins } from './builtin.js'
import { resolveProjectConfig } from './config.js'
import { runHooks } from './hooks.js'
import { resolveBuildOptions, type ClarifyBuildOptions, type ResolvedBuildOptions } from './options.js'

export type ResolvedClarifySite = {
  root: string
  contentRoot: string
  projectConfig: ReturnType<typeof resolveProjectConfig>
  generateOptions: ResolvedBuildOptions
  plugins: ClarifyPlugin[]
  ctx: ClarifyHookContext
  routes: ContentRoute[]
  navigation: NavigationTree
}

export type ResolveClarifySiteOptions = {
  includeHtmlShellPlugin?: boolean
}

function withAlternates(route: ContentRoute, routeList: ContentRoute[], i18n: ResolvedClarifyI18nConfig): ContentRoute {
  const basePath = route.basePath ?? route.path
  const routeByLocaleAndBase = new Map(routeList.map(route => [`${route.locale ?? ''}:${route.basePath ?? route.path}`, route]))
  const alternates = Object.fromEntries(
    i18n.locales.flatMap((locale) => {
      const alternate = routeByLocaleAndBase.get(`${locale.code}:${basePath}`)
      return alternate ? [[locale.code, alternate.path]] : []
    })
  )
  return { ...route, alternates }
}

async function discoverRoutesForRoot(routeRoot: string, locale: string | undefined, plugins: ClarifyPlugin[], ctx: ClarifyHookContext): Promise<ContentRoute[]> {
  const discovered = await runHooks(plugins, 'routes:discover', {
    contentRoot: routeRoot,
    locale,
    routes: findContentRoutes(routeRoot),
  }, ctx)
  return discovered.routes
}

async function discoverRoutes(root: string, contentRoot: string, plugins: ClarifyPlugin[], ctx: ClarifyHookContext): Promise<ContentRoute[]> {
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

  return localizedRoutes.map(route => withAlternates(route, localizedRoutes, i18n))
}

export async function resolveClarifySite(options: ClarifyBuildOptions = {}, resolveOptions: ResolveClarifySiteOptions = {}): Promise<ResolvedClarifySite> {
  const root = options.projectRoot ?? process.cwd()
  const projectConfig = resolveProjectConfig(options)
  const generateOptions = resolveBuildOptions(options)
  const contentRoot = join(root, generateOptions.rootDirectory)
  const plugins = [...createBuiltinPlugins({ htmlShell: resolveOptions.includeHtmlShellPlugin }), ...(options.plugins ?? [])]
  const ctx: ClarifyHookContext = { projectConfig, generateOptions, routes: [], navigation: [] }

  let routes = await discoverRoutes(root, contentRoot, plugins, ctx)
  routes = await runHooks(plugins, 'routes:discovered', routes, ctx)
  routes = applyConfiguredPageRoutePaths(routes, projectConfig.tabs, projectConfig.i18n)

  const defaultNavigation = projectConfig.tabs
    ? projectConfig.i18n
      ? (buildLocalizedNavigationFromTabsConfig(routes, projectConfig.tabs, projectConfig.i18n) ?? {})
      : buildNavigationFromTabsConfig(routes, projectConfig.tabs)
    : buildNavigation(routes)
  const resolved = await runHooks(plugins, 'routes:resolved', { routes, navigation: defaultNavigation }, ctx)
  routes = resolved.routes
  const navigation = resolved.navigation
  ctx.routes = routes
  ctx.navigation = navigation

  return {
    root,
    contentRoot,
    projectConfig,
    generateOptions,
    plugins,
    ctx,
    routes,
    navigation,
  }
}
