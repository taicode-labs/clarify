import type { UISlotRegistration } from '@clarify-labs/renderer'

import type { ClarifyPlugin, ContentDiagnostic, ContentRoute, ContentSection, MarkdownContentRoute, NavigationTree, ResolvedBuildOptions, ResolvedProjectConfig } from '../../types.js'

// 新的虚拟模块命名 - 更清晰的职责划分
const VIRTUAL_CONFIG = 'virtual:clarify/config'
export const VIRTUAL_ROUTES = 'virtual:clarify/routes'
const VIRTUAL_SERVER_ROUTES = 'virtual:clarify/routes/server'
export const VIRTUAL_OPENAPI = 'virtual:clarify/openapi'
export const VIRTUAL_OPENAPI_SERVER = 'virtual:clarify/openapi/server'
const VIRTUAL_SLOTS = 'virtual:clarify/slots'
const VIRTUAL_SLOT = 'virtual:clarify/slot'
export const VIRTUAL_CLIENT_ENTRY = 'virtual:clarify/entry-client'
const RESOLVED_CLIENT_ENTRY = '\0' + VIRTUAL_CLIENT_ENTRY

export type VirtualModules = Map<string, string>

type BuildVirtualModulesArgs = {
  generateOptions: ResolvedBuildOptions
  projectConfig: ResolvedProjectConfig
  routes: ContentRoute[]
  version?: string
  plugins?: ClarifyPlugin[]
  navigation: NavigationTree
  themeEditor?: boolean
}

export function resolveVirtualId(id: string): string {
  return '\0' + id
}

export function stripVirtualPrefix(id: string): string {
  return id.startsWith('\0') ? id.slice(1) : id
}

export function virtualContentModuleId(route: MarkdownContentRoute): string {
  return route.module.contentVirtualModuleId
}

/**
 * Fixed virtual module IDs (excluding the client entry, which has a special
 * resolved form). Used to avoid hardcoding the constant list in every
 * `resolveId` implementation.
 */
const FIXED_VIRTUAL_IDS = [
  VIRTUAL_CONFIG,
  VIRTUAL_ROUTES,
  VIRTUAL_SERVER_ROUTES,
  VIRTUAL_OPENAPI,
  VIRTUAL_OPENAPI_SERVER,
  VIRTUAL_SLOTS,
  VIRTUAL_SLOT,
] as const

/**
 * Shared `resolveId` logic for all Clarify virtual modules. Used by both the
 * Vite core plugin (dev + build) and the SSG virtual plugin so the ID-to-
 * resolved-ID mapping has a single source of truth.
 *
 * Returns the resolved ID (with `\0` prefix per Vite convention) or `null`
 * if the ID is not a Clarify virtual module.
 */
export function resolveVirtualModuleId(id: string, modules: VirtualModules, routes: readonly ContentRoute[]): string | null {
  if (id === VIRTUAL_CLIENT_ENTRY || id === RESOLVED_CLIENT_ENTRY) return RESOLVED_CLIENT_ENTRY

  for (const virtualId of FIXED_VIRTUAL_IDS) {
    if (id === virtualId || id === resolveVirtualId(virtualId)) return resolveVirtualId(virtualId)
  }

  const moduleId = stripVirtualPrefix(id)
  if (modules.has(moduleId)) return resolveVirtualId(moduleId)

  const contentRoute = routes.find(route => (route.kind === 'markdown' || route.kind === 'markdown+jsx') && route.module.contentVirtualModuleId === moduleId)
  if (contentRoute) return contentRoute.source.filePath

  const route = routes.find(route => route.module.pageVirtualModuleId === id || route.module.pageVirtualModuleId === moduleId)
  if (route) return resolveVirtualId(route.module.pageVirtualModuleId)

  return null
}

export function generateConfigModule(projectConfig: ResolvedProjectConfig, version?: string, themeEditor = false): string {
  const runtimeConfig: Record<string, unknown> = {
    title: projectConfig.title,
    description: projectConfig.description,
    siteUrl: projectConfig.siteUrl,
    routePrefix: projectConfig.routePrefix,
    assetPrefix: projectConfig.assetPrefix,
    logo: projectConfig.logo,
    homeUrl: projectConfig.homeUrl,
    favicon: projectConfig.favicon,
    theme: projectConfig.theme,
    layout: projectConfig.layout,
    navigation: projectConfig.navigation,
    banner: projectConfig.banner,
    footer: projectConfig.footer,
    locales: projectConfig.locales,
    variables: projectConfig.variables,
    features: projectConfig.features,
  }
  if (version) {
    runtimeConfig.version = version
  }
  return `export const config = ${JSON.stringify(runtimeConfig)};\nexport const runtime = ${JSON.stringify({ themeEditor })};`
}

function moduleSpecifier(value: string): string {
  return JSON.stringify(value)
}

type RuntimeRouteComponentExpression = string

type RuntimeRouteIdentity = {
  path: string
  basePath?: string
  locale?: string
  alternates?: Record<string, string>
  isFallback?: true
  isBareAlias?: true
}

type RuntimeRouteMetadata = {
  title: string
  description?: string
  keywords?: string[]
  sections?: ContentSection[]
}

type RuntimeRouteContentLinks = {
  contentArtifactUrl?: string
  sourceEditUrl?: string
}

type RuntimeRouteManifestEntry = RuntimeRouteIdentity & RuntimeRouteMetadata & RuntimeRouteContentLinks & {
  component: RuntimeRouteComponentExpression
  lazy?: true
  kind: ContentRoute['kind']
}

function routeToRuntimeManifestEntry(route: ContentRoute, component: RuntimeRouteComponentExpression, mode: 'client' | 'server'): RuntimeRouteManifestEntry {
  const entry: RuntimeRouteManifestEntry = {
    path: route.path,
    title: route.meta.title,
    component,
    kind: route.kind,
  }

  if (mode === 'client') entry.lazy = true
  if (route.basePath) entry.basePath = route.basePath
  if (route.locale) entry.locale = route.locale
  if (route.isFallback) entry.isFallback = true
  if (route.isBareAlias) entry.isBareAlias = true
  if (route.alternates) entry.alternates = route.alternates
  if (route.meta.description) entry.description = route.meta.description
  if (route.meta.keywords?.length) entry.keywords = route.meta.keywords
  if (route.artifacts?.contentArtifactUrl) entry.contentArtifactUrl = route.artifacts.contentArtifactUrl
  if (route.source?.sourceEditUrl) entry.sourceEditUrl = route.source.sourceEditUrl
  if (route.meta.sections?.length) {
    entry.sections = route.meta.sections.map(section => ({ id: section.id, title: section.title, level: section.level, badge: section.badge, tags: section.tags }))
  }

  return entry
}

export function generateRoutesModule(routes: ContentRoute[], navigation: NavigationTree, mode: 'client' | 'server' = 'client'): string {
  const imports = mode === 'server'
    ? routes.map((r, i) => `import Page${i} from ${moduleSpecifier(r.module.pageVirtualModuleId)};`).join('\n')
    : `import { createContentDiagnosticComponent } from '@clarify-labs/renderer';`

  // `component` is a raw JS expression (an identifier or arrow function),
  // not a JSON string. We serialize each route object with a unique placeholder
  // for the component, then replace it with the actual expression source.
  // This keeps the rest of the object fully type-checked via JSON.stringify
  // while avoiding fragile string concatenation for every field.
  const routeEntries = routes.map((r, i) => {
    const component = mode === 'server'
      ? `Page${i}`
      : `() => import(${moduleSpecifier(r.module.pageVirtualModuleId)}).catch((error) => Promise.resolve({ default: createContentDiagnosticComponent({ kind: 'route-load', title: 'This page could not be loaded', message: error instanceof Error ? error.message : String(error), details: error instanceof Error ? error.stack : undefined }) }))`
    const placeholder = `__COMPONENT_${i}__`
    const manifestEntry = routeToRuntimeManifestEntry(r, placeholder, mode)
    const json = JSON.stringify(manifestEntry, null, 0)
    // JSON.stringify quotes all keys and omits spaces after colons. Convert to
    // idiomatic JS object-literal syntax: unquote identifier keys, pad colons
    // with a single space. Non-identifier keys (none currently, but defensive)
    // keep their quotes. Replace the component placeholder first, before the
    // key-unquoting regex runs, so the placeholder (an identifier) is not
    // turned into a bare key.
    const jsObject = json
      .replace(`"${placeholder}"`, component)
      .replace(/"([A-Za-z_$][\w$]*)":/g, '$1: ')
    return `  ${jsObject}`
  }).join(',\n')

  return `${imports}\n\nexport const routes = [\n${routeEntries}\n];\n\nexport const navigation = ${JSON.stringify(navigation, null, 2)};\n`
}

export function createClientEntryModule(): string {
  return `
import '@clarify-labs/renderer/style.css';
import { render } from '@clarify-labs/renderer/client';
import { routes, navigation } from '${VIRTUAL_ROUTES}';
import { config, runtime } from '${VIRTUAL_CONFIG}';
import { openApiSpecs } from '${VIRTUAL_OPENAPI}';
import { runtimeSlots } from '${VIRTUAL_SLOTS}';
const renderOptions = { config, routes, navigation, openApiSpecs, runtimeSlots, themeEditor: runtime.themeEditor };
render(renderOptions);
if (import.meta.hot) {
  import.meta.hot.accept('${VIRTUAL_ROUTES}', (mod) => {
    render({ ...renderOptions, routes: mod.routes, navigation: mod.navigation });
  });
}`
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
    const entry = `{ plugin: ${JSON.stringify(plugin)}, loadComponent: () => import(${moduleSpecifier(componentPath)}) }`
    const list = grouped.get(slot.name) ?? []
    list.push(entry)
    grouped.set(slot.name, list)
  }

  const entries = [...grouped.entries()]
    .map(([name, list]) => `  ${JSON.stringify(name)}: [\n    ${list.join(',\n    ')}\n  ]`)
    .join(',\n')

  return `export const runtimeSlots = {\n${entries}\n};\n`
}

export function generateContentDiagnosticModule(diagnostic: ContentDiagnostic): string {
  return `import { createContentDiagnosticComponent } from '@clarify-labs/renderer';

export const contentDiagnostic = ${JSON.stringify(diagnostic)};

export default createContentDiagnosticComponent(contentDiagnostic);
`
}

export function buildVirtualModules(args: BuildVirtualModulesArgs): VirtualModules {
  const modules: VirtualModules = new Map()
  const clientEntryModule = createClientEntryModule()
  
  // Collect all plugins
  const allPlugins: ClarifyPlugin[] = [...(args.plugins ?? [])]
  
  modules.set(VIRTUAL_CONFIG, generateConfigModule(args.projectConfig, args.version, args.themeEditor))
  modules.set(VIRTUAL_ROUTES, generateRoutesModule(args.routes, args.navigation, 'client'))
  modules.set(VIRTUAL_SERVER_ROUTES, generateRoutesModule(args.routes, args.navigation, 'server'))
  modules.set(VIRTUAL_SLOTS, createRuntimeSlotsModule(allPlugins, args.generateOptions.projectRoot))
  modules.set(VIRTUAL_SLOT, "export { useSlot } from '@clarify-labs/renderer';\n")
  modules.set(VIRTUAL_OPENAPI, 'export const openApiSpecs = {};')
  modules.set(RESOLVED_CLIENT_ENTRY, clientEntryModule)
  modules.set(VIRTUAL_CLIENT_ENTRY, clientEntryModule)

  for (const route of args.routes) {
    const moduleContent = route.diagnostic
      ? generateContentDiagnosticModule(route.diagnostic)
      : route.kind === 'markdown' || route.kind === 'markdown+jsx'
        ? `export { default } from ${moduleSpecifier(virtualContentModuleId(route))};`
        : null
    if (moduleContent === null) continue
    modules.set(route.module.pageVirtualModuleId, moduleContent)
  }

  return modules
}
