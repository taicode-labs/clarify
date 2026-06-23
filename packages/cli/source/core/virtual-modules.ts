import { buildLocalizedNavigationFromTabsConfig, buildNavigation, buildNavigationFromTabsConfig } from '../parsers/routes.js'
import type { ContentRoute, NavigationTree, ResolvedBuildOptions, ResolvedProjectConfig } from '../types.js'

export const VIRTUAL_CONFIG = 'virtual:clarify-config'
export const VIRTUAL_ROUTES = 'virtual:clarify-routes'
export const VIRTUAL_SERVER_ROUTES = 'virtual:clarify-routes/server'
export const VIRTUAL_RUNTIME = 'virtual:clarify-runtime'
export const VIRTUAL_CONFIG_SOURCE = 'virtual:clarify-config-source'
export const VIRTUAL_CLIENT_ENTRY = 'virtual:clarify-entry-client'
export const RESOLVED_CLIENT_ENTRY = '\0' + VIRTUAL_CLIENT_ENTRY

export type VirtualModules = Map<string, string>

type RuntimeImports = {
  footerComponent?: string
}

type RuntimeModuleOptions = {
  imports?: RuntimeImports
  footerComponentSource?: 'path' | 'config'
}

type BuildVirtualModulesArgs = {
  projectConfig: ResolvedProjectConfig
  generateOptions: ResolvedBuildOptions
  routes: ContentRoute[]
  navigation?: NavigationTree
  themeEditor?: boolean
  configFilePath?: string
}

type CreateClientEntryModuleOptions = {
  themeEditor?: boolean
}

export function resolveVirtualId(id: string): string {
  return '\0' + id
}

export function stripVirtualPrefix(id: string): string {
  return id.startsWith('\0') ? id.slice(1) : id
}

function serializableProjectConfig(projectConfig: ResolvedProjectConfig): ResolvedProjectConfig {
  if (typeof projectConfig.footer !== 'function') return projectConfig
  return {
    ...projectConfig,
    footer: undefined,
  }
}

export function generateConfigModule(projectConfig: ResolvedProjectConfig, buildOptions: ResolvedBuildOptions): string {
  return `export const config = ${JSON.stringify({ ...serializableProjectConfig(projectConfig), ...buildOptions })};`
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
    const sourceUrl = r.sourceUrl ? `, sourceUrl: ${JSON.stringify(r.sourceUrl)}` : ''
    const component = mode === 'server' ? `Page${i}` : `() => import(${moduleSpecifier(r.virtualModuleId)})`
    const lazy = mode === 'client' ? ', lazy: true' : ''
    return `  { path: ${JSON.stringify(r.path)}, title: ${JSON.stringify(r.title)}, component: ${component}${lazy}, kind: ${JSON.stringify(r.kind)}${basePath}${locale}${isFallback}${alternates}${description}${keywords}${sections}${contentArtifactUrl}${sourceUrl} }`
  }).join(',\n')

  const navigation = resolvedNavigation ?? (projectConfig?.tabs
    ? projectConfig.i18n
      ? (buildLocalizedNavigationFromTabsConfig(routes, projectConfig.tabs, projectConfig.i18n) ?? {})
      : buildNavigationFromTabsConfig(routes, projectConfig.tabs)
    : buildNavigation(routes))

  return `${imports}\n\nexport const routes = [\n${routesArray}\n];\n\nexport const navigation = ${JSON.stringify(navigation, null, 2)};\n`
}

export function createRuntimeModule(options: RuntimeModuleOptions = {}): string {
  const footerComponentImport = options.footerComponentSource === 'path' && options.imports?.footerComponent
    ? `import FooterComponent from ${moduleSpecifier(options.imports.footerComponent)};`
    : ''
  const configImport = options.footerComponentSource === 'config'
    ? `import { userConfig as ClarifyUserConfig } from '${VIRTUAL_CONFIG_SOURCE}';`
    : ''
  const footerComponent = options.footerComponentSource === 'path'
    ? 'FooterComponent'
    : options.footerComponentSource === 'config'
      ? `typeof ClarifyUserConfig.footer === 'function' ? ClarifyUserConfig.footer : undefined`
      : 'undefined'
  return `${footerComponentImport}${configImport}
export const openApis = {};
export const footerComponent = ${footerComponent};`
}

export function createClientEntryModule(options: CreateClientEntryModuleOptions = {}): string {
  return `
import '@clarify-labs/renderer/style.css';
import { render } from '@clarify-labs/renderer/client';
import { routes, navigation } from '${VIRTUAL_ROUTES}';
import { config } from '${VIRTUAL_CONFIG}';
import { openApis, footerComponent } from '${VIRTUAL_RUNTIME}';
render({ config, routes, navigation, openApis, footerComponent, themeEditor: ${JSON.stringify(options.themeEditor ?? false)} });`
}

export function buildVirtualModules(args: BuildVirtualModulesArgs): VirtualModules {
  const modules: VirtualModules = new Map()
  const clientEntryModule = createClientEntryModule({ themeEditor: args.themeEditor })
  const footerComponentSource = typeof args.projectConfig.footer === 'string'
    ? 'path'
    : typeof args.projectConfig.footer === 'function' && args.configFilePath
      ? 'config'
      : undefined
  const footerComponentImport = footerComponentSource === 'path' ? args.projectConfig.footer as string : undefined
  modules.set(VIRTUAL_CONFIG, generateConfigModule(args.projectConfig, args.generateOptions))
  if (args.configFilePath) {
    modules.set(VIRTUAL_CONFIG_SOURCE, `export { default as userConfig } from ${moduleSpecifier(args.configFilePath)};`)
  } else {
    modules.set(VIRTUAL_CONFIG_SOURCE, 'export const userConfig = {};')
  }
  modules.set(VIRTUAL_ROUTES, generateRoutesModule(args.routes, args.navigation, args.projectConfig, 'client'))
  modules.set(VIRTUAL_SERVER_ROUTES, generateRoutesModule(args.routes, args.navigation, args.projectConfig, 'server'))
  modules.set(VIRTUAL_RUNTIME, createRuntimeModule({ footerComponentSource, imports: { footerComponent: footerComponentImport } }))
  modules.set(VIRTUAL_CLIENT_ENTRY, clientEntryModule)
  modules.set(RESOLVED_CLIENT_ENTRY, clientEntryModule)

  for (const route of args.routes) {
    modules.set(route.virtualModuleId, `export { default } from ${moduleSpecifier(route.filePath)};`)
  }

  return modules
}
