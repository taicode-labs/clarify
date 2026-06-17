import { buildNavigation, buildNavigationFromConfig } from './routes.js'
import type { ClarifyPagesConfig, ContentRoute, OpenAPISpec, ResolvedGenerateOptions, ResolvedProjectConfig } from './types.js'

export const VIRTUAL_CONFIG = 'virtual:clarify-config'
export const VIRTUAL_ROUTES = 'virtual:clarify-routes'
export const VIRTUAL_OPENAPI_REGISTRY = 'virtual:clarify-openapi-registry'
export const VIRTUAL_CLIENT_ENTRY = 'virtual:clarify-entry-client'
export const RESOLVED_CLIENT_ENTRY = '\0' + VIRTUAL_CLIENT_ENTRY

export type VirtualModules = Map<string, string>

export function resolveVirtualId(id: string): string {
  return '\0' + id
}

export function stripVirtualPrefix(id: string): string {
  return id.startsWith('\0') ? id.slice(1) : id
}

export function generateConfigModule(projectConfig: ResolvedProjectConfig, generateOptions: ResolvedGenerateOptions): string {
  return `export const config = ${JSON.stringify({ ...projectConfig, ...generateOptions })};`
}

export function generateRoutesModule(routes: ContentRoute[], pagesConfig?: ClarifyPagesConfig, resolvedNavigation?: ReturnType<typeof buildNavigation>): string {
  const imports = routes.map((r, i) => `import Page${i} from '${r.virtualModuleId}';`).join('\n')
  const routesArray = routes.map((r, i) => {
    const sections = r.sections && r.sections.length > 0
      ? `, sections: ${JSON.stringify(r.sections.map(s => ({ id: s.id, title: s.title, badge: s.badge, tags: s.tags })))}`
      : ''
    const rawContentUrl = r.rawContentUrl ? `, rawContentUrl: ${JSON.stringify(r.rawContentUrl)}` : ''
    return `  { path: ${JSON.stringify(r.path)}, title: ${JSON.stringify(r.title)}, component: Page${i}, kind: '${r.kind}'${sections}${rawContentUrl} }`
  }).join(',\n')

  const navigation = resolvedNavigation ?? (pagesConfig && pagesConfig !== 'FileTree'
    ? buildNavigationFromConfig(routes, pagesConfig)
    : buildNavigation(routes))

  return `${imports}\n\nexport const routes = [\n${routesArray}\n];\n\nexport const navigation = ${JSON.stringify(navigation, null, 2)};\n`
}

export function generateOpenAPIRegistryModule(openApiSpecs: Record<string, OpenAPISpec>): string {
  return `export const openApiSpecs = ${JSON.stringify(openApiSpecs)};`
}

export function generateOpenAPIModule(spec: OpenAPISpec): string {
  return `import { createElement } from 'react';
import { OpenApiPage } from '@clarify/renderer';
const spec = ${JSON.stringify(spec)};
export default function OpenApiRoutePage() {
  return createElement(OpenApiPage, { spec });
}`
}

export function createClientEntryModule(): string {
  return `
import '@clarify/renderer/style.css';
import { render } from '@clarify/renderer';
import { routes, navigation } from '${VIRTUAL_ROUTES}';
import { config } from '${VIRTUAL_CONFIG}';
import { openApiSpecs } from '${VIRTUAL_OPENAPI_REGISTRY}';
render({ config, routes, navigation, openApiSpecs });`
}

export function buildVirtualModules(args: {
  projectConfig: ResolvedProjectConfig
  generateOptions: ResolvedGenerateOptions
  routes: ContentRoute[]
  navigation?: ReturnType<typeof buildNavigation>
  openApiSpecs: Record<string, OpenAPISpec>
}): VirtualModules {
  const modules: VirtualModules = new Map()
  modules.set(VIRTUAL_CONFIG, generateConfigModule(args.projectConfig, args.generateOptions))
  modules.set(VIRTUAL_ROUTES, generateRoutesModule(args.routes, args.projectConfig.pages, args.navigation))
  modules.set(VIRTUAL_OPENAPI_REGISTRY, generateOpenAPIRegistryModule(args.openApiSpecs))
  modules.set(VIRTUAL_CLIENT_ENTRY, createClientEntryModule())
  modules.set(RESOLVED_CLIENT_ENTRY, createClientEntryModule())

  for (const route of args.routes) {
    if (route.kind === 'openapi') {
      const spec = args.openApiSpecs[route.virtualModuleId]
      if (!spec) {
        throw new Error(`OpenAPI spec failed to load for ${route.filePath}`)
      }
      modules.set(route.virtualModuleId, generateOpenAPIModule(spec))
    } else {
      modules.set(route.virtualModuleId, `export { default } from '${route.filePath}';`)
    }
  }

  return modules
}
