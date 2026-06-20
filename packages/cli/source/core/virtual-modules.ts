import { buildLocalizedNavigationFromTabsConfig, buildNavigation, buildNavigationFromTabsConfig } from '../parsers/routes.js'
import { openApiRegistryModuleId } from '../plugins/openapi/virtual-modules.js'
import type { ContentRoute, NavigationTree, ResolvedBuildOptions, ResolvedProjectConfig } from '../types.js'

export const VIRTUAL_CONFIG = 'virtual:clarify-config'
export const VIRTUAL_ROUTES = 'virtual:clarify-routes'
export const VIRTUAL_SERVER_ROUTES = 'virtual:clarify-routes/server'
export const VIRTUAL_OPENAPI_REGISTRY = openApiRegistryModuleId
export const VIRTUAL_CLIENT_ENTRY = 'virtual:clarify-entry-client'
export const RESOLVED_CLIENT_ENTRY = '\0' + VIRTUAL_CLIENT_ENTRY

export type VirtualModules = Map<string, string>

export function resolveVirtualId(id: string): string {
  return '\0' + id
}

export function stripVirtualPrefix(id: string): string {
  return id.startsWith('\0') ? id.slice(1) : id
}

export function generateConfigModule(projectConfig: ResolvedProjectConfig, buildOptions: ResolvedBuildOptions): string {
  return `export const config = ${JSON.stringify({ ...projectConfig, ...buildOptions })};`
}

function moduleSpecifier(value: string): string {
  return JSON.stringify(value)
}

export function generateRoutesModule(routes: ContentRoute[], resolvedNavigation?: NavigationTree, projectConfig?: ResolvedProjectConfig, mode: 'client' | 'server' = 'client'): string {
  const imports = mode === 'server'
    ? routes.map((r, i) => `import Page${i} from ${moduleSpecifier(r.virtualModuleId)};`).join('\n')
    : ''
  const routesArray = routes.map((r, i) => {
    const sections = r.sections && r.sections.length > 0
      ? `, sections: ${JSON.stringify(r.sections.map(s => ({ id: s.id, title: s.title, badge: s.badge, tags: s.tags })))}`
      : ''
    const contentArtifactUrl = r.contentArtifactUrl ? `, contentArtifactUrl: ${JSON.stringify(r.contentArtifactUrl)}` : ''
    const basePath = r.basePath ? `, basePath: ${JSON.stringify(r.basePath)}` : ''
    const locale = r.locale ? `, locale: ${JSON.stringify(r.locale)}` : ''
    const isFallback = r.isFallback ? ', isFallback: true' : ''
    const alternates = r.alternates ? `, alternates: ${JSON.stringify(r.alternates)}` : ''
    const description = r.description ? `, description: ${JSON.stringify(r.description)}` : ''
    const keywords = r.keywords && r.keywords.length > 0 ? `, keywords: ${JSON.stringify(r.keywords)}` : ''
    const component = mode === 'server' ? `Page${i}` : `() => import(${moduleSpecifier(r.virtualModuleId)})`
    const lazy = mode === 'client' ? ', lazy: true' : ''
    return `  { path: ${JSON.stringify(r.path)}, title: ${JSON.stringify(r.title)}, component: ${component}${lazy}, kind: ${JSON.stringify(r.kind)}${basePath}${locale}${isFallback}${alternates}${description}${keywords}${sections}${contentArtifactUrl} }`
  }).join(',\n')

  const navigation = resolvedNavigation ?? (projectConfig?.tabs
    ? projectConfig.i18n
      ? (buildLocalizedNavigationFromTabsConfig(routes, projectConfig.tabs, projectConfig.i18n) ?? {})
      : buildNavigationFromTabsConfig(routes, projectConfig.tabs)
    : buildNavigation(routes))

  return `${imports}\n\nexport const routes = [\n${routesArray}\n];\n\nexport const navigation = ${JSON.stringify(navigation, null, 2)};\n`
}

export function createClientEntryModule(): string {
  return `
import '@clarify-labs/renderer/style.css';
import { render } from '@clarify-labs/renderer/client';
import { routes, navigation } from '${VIRTUAL_ROUTES}';
import { config } from '${VIRTUAL_CONFIG}';
import { openApis } from '${VIRTUAL_OPENAPI_REGISTRY}';
render({ config, routes, navigation, openApis });`
}

export function buildVirtualModules(args: {
  projectConfig: ResolvedProjectConfig
  generateOptions: ResolvedBuildOptions
  routes: ContentRoute[]
  navigation?: NavigationTree
}): VirtualModules {
  const modules: VirtualModules = new Map()
  modules.set(VIRTUAL_CONFIG, generateConfigModule(args.projectConfig, args.generateOptions))
  modules.set(VIRTUAL_ROUTES, generateRoutesModule(args.routes, args.navigation, args.projectConfig, 'client'))
  modules.set(VIRTUAL_SERVER_ROUTES, generateRoutesModule(args.routes, args.navigation, args.projectConfig, 'server'))
  modules.set(VIRTUAL_OPENAPI_REGISTRY, 'export const openApis = {};')
  modules.set(VIRTUAL_CLIENT_ENTRY, createClientEntryModule())
  modules.set(RESOLVED_CLIENT_ENTRY, createClientEntryModule())

  for (const route of args.routes) {
    if (route.kind === 'openapi') continue
    modules.set(route.virtualModuleId, `export { default } from ${moduleSpecifier(route.filePath)};`)
  }

  return modules
}
