import { buildLocalizedNavigationFromTabsConfig, buildNavigation, buildNavigationFromTabsConfig } from '../parsers/routes.js'
import type { ClarifyPlugin, ClarifyUISlotRegistration, ContentRoute, NavigationTree, ResolvedBuildOptions, ResolvedProjectConfig } from '../types.js'

// 新的虚拟模块命名 - 更清晰的职责划分
export const VIRTUAL_CONFIG = 'virtual:clarify/config'
export const VIRTUAL_ROUTES = 'virtual:clarify/routes'
export const VIRTUAL_SERVER_ROUTES = 'virtual:clarify/routes/server'
export const VIRTUAL_OPENAPI = 'virtual:clarify/openapi'
export const VIRTUAL_SLOTS = 'virtual:clarify/slots'
export const VIRTUAL_SLOT = 'virtual:clarify/slot'
export const VIRTUAL_CLIENT_ENTRY = 'virtual:clarify/entry-client'
export const RESOLVED_CLIENT_ENTRY = '\0' + VIRTUAL_CLIENT_ENTRY

export type VirtualModules = Map<string, string>

type BuildVirtualModulesArgs = {
  projectConfig: ResolvedProjectConfig
  generateOptions: ResolvedBuildOptions
  routes: ContentRoute[]
  navigation?: NavigationTree
  plugins?: ClarifyPlugin[]
  themeEditor?: boolean
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
      ? `, sections: ${JSON.stringify(r.sections.map(s => ({ id: s.id, title: s.title, level: s.level, badge: s.badge, tags: s.tags })))}`
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

export function createRuntimeModule(): string {
  return `export const openApis = {};`
}

export function createClientEntryModule(options: CreateClientEntryModuleOptions = {}): string {
  return `
import '@clarify-labs/renderer/style.css';
import { render } from '@clarify-labs/renderer/client';
import { routes, navigation } from '${VIRTUAL_ROUTES}';
import { config } from '${VIRTUAL_CONFIG}';
import { openApis } from '${VIRTUAL_OPENAPI}';
import { runtimeSlots } from '${VIRTUAL_SLOTS}';
render({ config, routes, navigation, openApis, runtimeSlots, themeEditor: ${JSON.stringify(options.themeEditor ?? false)} });`
}

/**
 * Valid slot names (keep in sync with type definition).
 */
const VALID_SLOT_NAMES = new Set([
  'page.footer.before',
  'page.banner.replace',
  'page.footer.replace',
])

/**
 * Collect every plugin's `slots` declarations into a single runtime registry
 * module. Component modules are exported as lazy import factories so the
 * renderer can decide whether to code-split (client) or pre-resolve (SSR).
 */
export function createRuntimeSlotsModule(plugins: ClarifyPlugin[] = []): string {
  const registrations: { plugin: string; slot: ClarifyUISlotRegistration }[] = []
  for (const plugin of plugins) {
    for (const slot of plugin.slots ?? []) {
      if (!VALID_SLOT_NAMES.has(slot.name)) {
        throw new Error(`[clarify] Plugin "${plugin.name}" registered invalid slot name "${slot.name}". Valid slots are: ${[...VALID_SLOT_NAMES].join(', ')}`)
      }
      registrations.push({ plugin: plugin.name, slot })
    }
  }

  if (registrations.length === 0) {
    return 'export const runtimeSlots = {};\n'
  }

  const grouped = new Map<string, string[]>()
  for (const { plugin, slot } of registrations) {
    const entry = `{ plugin: ${JSON.stringify(plugin)}, component: () => import(${moduleSpecifier(slot.component)}) }`
    const list = grouped.get(slot.name) ?? []
    list.push(entry)
    grouped.set(slot.name, list)
  }

  const entries = [...grouped.entries()]
    .map(([name, list]) => `  ${JSON.stringify(name)}: [\n    ${list.join(',\n    ')}\n  ]`)
    .join(',\n')

  return `export const runtimeSlots = {\n${entries}\n};\n`
}

/**
 * Re-exports the slot context hook from the renderer so plugin components can
 * `import { useClarifySlot } from 'virtual:clarify-slot'` without depending on
 * renderer internals directly.
 */
export function createSlotModule(): string {
  return `export { useClarifySlot } from '@clarify-labs/renderer';\n`
}

export function buildVirtualModules(args: BuildVirtualModulesArgs): VirtualModules {
  const modules: VirtualModules = new Map()
  const clientEntryModule = createClientEntryModule({ themeEditor: args.themeEditor })
  
  // Collect all plugins and internal slots from config
  const allPlugins: ClarifyPlugin[] = [...(args.plugins ?? [])]
  
  // Create internal plugin for config banner/footer if they're component paths
  const internalSlots: ClarifyUISlotRegistration[] = []
  const bannerConfig = args.projectConfig.banner
  const footerConfig = args.projectConfig.footer
  
  if (typeof bannerConfig === 'string') {
    internalSlots.push({ name: 'page.banner.replace', component: bannerConfig })
  }
  
  if (typeof footerConfig === 'string') {
    internalSlots.push({ name: 'page.footer.replace', component: footerConfig })
  }
  
  if (internalSlots.length > 0) {
    allPlugins.push({ name: 'clarify-internal', hooks: {}, slots: internalSlots })
  }
  
  modules.set(VIRTUAL_CONFIG, generateConfigModule(args.projectConfig, args.generateOptions))
  modules.set(VIRTUAL_ROUTES, generateRoutesModule(args.routes, args.navigation, args.projectConfig, 'client'))
  modules.set(VIRTUAL_SERVER_ROUTES, generateRoutesModule(args.routes, args.navigation, args.projectConfig, 'server'))
  modules.set(VIRTUAL_SLOTS, createRuntimeSlotsModule(allPlugins))
  modules.set(VIRTUAL_OPENAPI, generateOpenApiModule())
  modules.set(VIRTUAL_SLOT, createSlotModule())
  modules.set(VIRTUAL_CLIENT_ENTRY, clientEntryModule)
  modules.set(RESOLVED_CLIENT_ENTRY, clientEntryModule)

  for (const route of args.routes) {
    modules.set(route.virtualModuleId, `export { default } from ${moduleSpecifier(route.filePath)};`)
  }

  return modules
}

// 新的 OpenAPI 模块生成函数 - 独立出来
export function generateOpenApiModule(): string {
  return `export const openApis = {};`
}
