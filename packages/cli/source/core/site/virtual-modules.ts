import type { UISlotRegistration } from '@clarify-labs/renderer'

import { buildLocalizedNavigationFromTabsConfig, buildNavigation, buildNavigationFromTabsConfig } from '../../parsers/router/index.js'
import type { ClarifyPlugin, ContentDiagnostic, ContentRoute, NavigationTree, ResolvedBuildOptions, ResolvedProjectConfig } from '../../types.js'

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
  generateOptions: ResolvedBuildOptions
  projectConfig: ResolvedProjectConfig
  routes: ContentRoute[]
  version?: string
  plugins?: ClarifyPlugin[]
  navigation?: NavigationTree
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

export function generateConfigModule(projectConfig: ResolvedProjectConfig, buildOptions: ResolvedBuildOptions, version?: string): string {
  const runtimeConfig: Record<string, unknown> = { ...projectConfig, ...buildOptions }
  if (version) {
    runtimeConfig.version = version
  }
  return `export const config = ${JSON.stringify(runtimeConfig)};`
}

function moduleSpecifier(value: string): string {
  return JSON.stringify(value)
}

function createRendererRouteModule(routeData: string): string {
  return `import { createDocumentRouteComponent } from '@clarify-labs/renderer';

export const routeData = ${routeData};

export default createDocumentRouteComponent(routeData);
`
}

export function generateRoutesModule(routes: ContentRoute[], resolvedNavigation?: NavigationTree, projectConfig?: ResolvedProjectConfig, mode: 'client' | 'server' = 'client'): string {
  const imports = mode === 'server'
    ? routes.map((r, i) => `import Page${i} from ${moduleSpecifier(r.virtualModuleId)};`).join('\n')
    : `import { createContentDiagnosticComponent } from '@clarify-labs/renderer';`
  const routesArray = routes.map((r, i) => {
    const document = r.document?.metadata
      ? `, document: ${JSON.stringify({
          metadata: {
            sections: r.document.metadata.sections?.map(s => ({ id: s.id, title: s.title, level: s.level, badge: s.badge, tags: s.tags })),
            description: r.document.metadata.description,
            keywords: r.document.metadata.keywords,
            diagnostic: r.document.metadata.diagnostic,
          },
        })}`
      : ''
    const contentArtifactUrl = r.artifact?.contentArtifactUrl ? `, contentArtifactUrl: ${JSON.stringify(r.artifact.contentArtifactUrl)}` : ''
    const basePath = r.basePath ? `, basePath: ${JSON.stringify(r.basePath)}` : ''
    const locale = r.locale ? `, locale: ${JSON.stringify(r.locale)}` : ''
    const isFallback = r.isFallback ? ', isFallback: true' : ''
    const isBareAlias = r.isBareAlias ? ', isBareAlias: true' : ''
    const alternates = r.alternates ? `, alternates: ${JSON.stringify(r.alternates)}` : ''
    const sourceUrl = r.artifact?.sourceUrl ? `, sourceUrl: ${JSON.stringify(r.artifact.sourceUrl)}` : ''
    const component = mode === 'server'
      ? `Page${i}`
      : `() => import(${moduleSpecifier(r.virtualModuleId)}).catch((error) => Promise.resolve({ default: createContentDiagnosticComponent({ kind: 'route-load', title: 'This page could not be loaded', message: error instanceof Error ? error.message : String(error), details: error instanceof Error ? error.stack : undefined }) }))`
    const lazy = mode === 'client' ? ', lazy: true' : ''
    return `  { path: ${JSON.stringify(r.path)}, title: ${JSON.stringify(r.title)}, component: ${component}${lazy}, kind: ${JSON.stringify(r.kind)}${basePath}${locale}${isFallback}${isBareAlias}${alternates}${document}${contentArtifactUrl}${sourceUrl} }`
  }).join(',\n')

  const navigation = resolvedNavigation ?? (projectConfig?.tabs
    ? projectConfig.i18n
      ? (buildLocalizedNavigationFromTabsConfig(routes, projectConfig.tabs, projectConfig.i18n) ?? {})
      : buildNavigationFromTabsConfig(routes, projectConfig.tabs)
    : buildNavigation(routes))

  return `${imports}\n\nexport const routes = [\n${routesArray}\n];\n\nexport const navigation = ${JSON.stringify(navigation, null, 2)};\n`
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
 * Collect every plugin's `slots` declarations into a single runtime registry
 * module. Component modules are exported as lazy import factories so the
 * renderer can decide whether to code-split (client) or pre-resolve (SSR).
 *
 * Relative component paths are resolved against the project `root` so that
 * the generated `import()` call uses an absolute specifier — Vite cannot
 * resolve relative imports from virtual modules.
 *
 * Slot name validity is enforced at compile time by the `UISlotName`
 * type — no runtime validation is needed.
 */
export function createRuntimeSlotsModule(plugins: ClarifyPlugin[] = [], root: string = process.cwd()): string {
  const registrations: { plugin: string; slot: UISlotRegistration }[] = []
  for (const plugin of plugins) {
    for (const slot of plugin.slots ?? []) {
      registrations.push({ plugin: plugin.name, slot })
    }
  }

  if (registrations.length === 0) {
    return 'export const runtimeSlots = {};\n'
  }

  const grouped = new Map<string, string[]>()
  for (const { plugin, slot } of registrations) {
    // Warn when multiple plugins register the same replace slot — only the
    // last one takes effect, which is almost certainly a configuration error.
    if (slot.name.endsWith('.replace')) {
      const existing = grouped.get(slot.name)
      if (existing) {
        console.warn(`[clarify] Multiple plugins register slot "${slot.name}": "${plugin}" overrides "${existing[existing.length - 1]}". Only the last registration is used.`)
      }
    }

    // Resolve `/`-prefixed paths relative to the project root so that
    // Vite can resolve the import from the virtual module.
    if (!slot.component.startsWith('/')) {
      throw new Error(`[clarify] Plugin "${plugin}" slot "${slot.name}" has an invalid component path "${slot.component}". Component paths must start with "/" to reference the project root.`)
    }
    const componentPath = root + slot.component
    const entry = `{ plugin: ${JSON.stringify(plugin)}, component: () => import(${moduleSpecifier(componentPath)}) }`
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
 * `import { useSlot } from 'virtual:clarify/slot'` without depending on
 * renderer internals directly.
 */
export function createSlotModule(): string {
  return `export { useSlot } from '@clarify-labs/renderer';\n`
}

export function generateMdxErrorModule(diagnostic: ContentDiagnostic): string {
  return `import { createContentDiagnosticComponent } from '@clarify-labs/renderer';

export const contentDiagnostic = ${JSON.stringify({
    kind: diagnostic.kind ?? 'mdx',
    title: diagnostic.title,
    message: diagnostic.message,
    filePath: diagnostic.filePath,
    details: diagnostic.details,
  })};

export default createContentDiagnosticComponent(contentDiagnostic);
`
}

export function generateDocumentRouteModule(route: ContentRoute): string {
  return createRendererRouteModule(JSON.stringify({ contentDocument: route.document }))
}

export function buildVirtualModules(args: BuildVirtualModulesArgs): VirtualModules {
  const modules: VirtualModules = new Map()
  const clientEntryModule = createClientEntryModule({ themeEditor: args.themeEditor })
  
  // Collect all plugins
  const allPlugins: ClarifyPlugin[] = [...(args.plugins ?? [])]
  
  modules.set(VIRTUAL_CONFIG, generateConfigModule(args.projectConfig, args.generateOptions, args.version))
  modules.set(VIRTUAL_ROUTES, generateRoutesModule(args.routes, args.navigation, args.projectConfig, 'client'))
  modules.set(VIRTUAL_SERVER_ROUTES, generateRoutesModule(args.routes, args.navigation, args.projectConfig, 'server'))
  modules.set(VIRTUAL_SLOTS, createRuntimeSlotsModule(allPlugins, args.generateOptions.projectRoot))
  modules.set(VIRTUAL_OPENAPI, generateOpenApiModule(args.routes))
  modules.set(VIRTUAL_SLOT, createSlotModule())
  modules.set(VIRTUAL_CLIENT_ENTRY, clientEntryModule)
  modules.set(RESOLVED_CLIENT_ENTRY, clientEntryModule)

  for (const route of args.routes) {
    const moduleContent = route.document?.metadata.diagnostic
      ? generateMdxErrorModule(route.document.metadata.diagnostic)
      : route.document
        ? generateDocumentRouteModule(route)
        : `export { default } from ${moduleSpecifier(route.filePath)};`
    modules.set(route.virtualModuleId, moduleContent)
  }

  return modules
}

export function generateOpenApiModule(routes: ContentRoute[] = []): string {
  const entries = routes
    .filter(() => false)
    .map(route => `${JSON.stringify(route.virtualModuleId)}: ${JSON.stringify(route)}`)

  return `export const openApis = {${entries.join(',')}};`
}
