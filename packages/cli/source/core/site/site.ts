import { join, relative } from 'node:path'

import { applyConfiguredPageRoutePaths, buildLocalizedNavigationFromTabsConfig, buildNavigation, buildNavigationFromTabsConfig, findContentRoutes, localizedRoutePath, virtualModuleIdFromRef, withAlternates } from '../../parsers/routes/routes.js'
import type { ClarifyPage, ClarifyPlugin, ContentRoute, NavigationTree } from '../../types.js'
import type { ClarifyBuildOptions, ResolvedBuildOptions } from '../config/options.js'
import { createProjectContentProcessor, getProjectContentProcessor, setProjectContentProcessor } from '../content/content.js'
import { ClarifyContext } from '../engine/context.js'
import { runPhase } from '../engine/phases.js'
import { runHooks } from '../plugin/hooks.js'
import { loadBuildPluginsForContext } from '../plugin/manager.js'
import { resolveProjectContext } from '../project/project-context.js'

export type ResolvedClarifySite = {
  root: string
  contentRoot: string
  projectConfig: Awaited<ReturnType<typeof resolveProjectContext>>['projectConfig']
  generateOptions: ResolvedBuildOptions
  plugins: ClarifyPlugin[]
  ctx: ClarifyContext
  routes: ContentRoute[]
  navigation: NavigationTree
}

export type ResolveClarifySiteOptions = {
  includeHtmlShellPlugin?: boolean
}

async function discoverRoutesForRoot(routeRoot: string, locale: string | undefined, plugins: ClarifyPlugin[], ctx: ClarifyContext): Promise<ContentRoute[]> {
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

async function discoverRoutes(root: string, contentRoot: string, plugins: ClarifyPlugin[], ctx: ClarifyContext): Promise<ContentRoute[]> {
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

export async function resolveClarifySite(options: ClarifyBuildOptions = {}, resolveOptions: ResolveClarifySiteOptions = {}): Promise<ResolvedClarifySite> {
  const context = await resolveProjectContext(options)
  const root = context.projectRoot
  const projectConfig = context.projectConfig
  const generateOptions = context.buildOptions
  const contentRoot = context.contentRoot
  const ctx = new ClarifyContext({
    projectRoot: root,
    contentRoot,
    projectConfig,
    generateOptions,
    version: context.projectContext.version,
  })
  const plugins = await loadBuildPluginsForContext(ctx, options, { htmlShell: resolveOptions.includeHtmlShellPlugin })
  setProjectContentProcessor(ctx, createProjectContentProcessor(plugins, ctx))

  // Phase 3: Site Discovery — scan content directory and perform initial
  // route extraction. Content transforms happen inside findContentRoutes via
  // the ContentProcessor, which is the practical compile-to-runtime boundary.
  let routes = await runPhase(plugins, 'site:discover', ctx, () => discoverRoutes(root, contentRoot, plugins, ctx))
  routes = await runHooks(plugins, 'routes:discovered', routes, ctx)

  // Phase 4: Content Process — post-discovery content adjustments.
  routes = await runPhase(plugins, 'content:process', ctx, async () => {
    // Pipeline hook: pages:resolved — allow plugins to inspect or transform
    // all pages after route discovery but before navigation and virtual modules.
    const pages = routes.map<ClarifyPage>(route => ({
      path: route.path,
      filePath: route.filePath,
      frontmatter: route.frontmatter ?? {},
      content: route.content ?? '',
    }))
    const resolvedPages = await runHooks(plugins, 'pages:resolved', pages, ctx)
    const pageByPath = new Map(resolvedPages.map(p => [p.path, p]))
    routes = routes.map(route => {
      const page = pageByPath.get(route.path)
      if (!page) return route
      return {
        ...route,
        frontmatter: page.frontmatter,
        content: page.content,
      }
    })

    return applyConfiguredPageRoutePaths(routes, projectConfig.tabs, projectConfig.i18n)
  })

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
    ctx,
    root,
    routes,
    plugins,
    navigation,
    contentRoot,
    projectConfig,
    generateOptions,
  }
}
