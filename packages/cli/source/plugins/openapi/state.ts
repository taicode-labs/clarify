import { relative } from 'node:path'

import { generateContentDiagnosticModule, type VirtualModules } from '../../core/runtime/virtual-modules.js'
import { createProjectContentProcessor } from '../../parsers/content/content.js'
import type { ClarifyHookContext, ContentRoute, OpenAPISpec } from '../../types.js'

import { extractOpenAPISections, filterSpecByTags, normalizeOpenAPISpecSectionIds, readOpenAPISpec } from './parser.js'
import { generateOpenAPIPageModule, generateOpenAPIRegistryModule, generateOpenAPIServerRegistryModule, generateOpenAPISpecModule, openApiRegistryModuleId, openApiServerRegistryModuleId, specVirtualModuleId } from './virtual-modules.js'

function sourceSpecIdFromPath(filePath: string, projectRoot: string): string {
  return relative(projectRoot, filePath).replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
}

function routeSpecModuleIdFromSourceSpecId(sourceSpecId: string, tagFilter?: string[]): string {
  if (!tagFilter?.length) return sourceSpecId
  const suffix = tagFilter.map(tag => tag.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'tag').join('_')
  return `${sourceSpecId}_tags_${suffix}`
}

function openAPIRegistryKeys(route: ContentRoute): string[] {
  const keys = new Set<string>()
  const path = (route.path || '/').replace(/^\//, '')
  const base = (route.basePath ?? route.path).replace(/^\//, '')

  if (route.locale) keys.add(`virtual:clarify-page/${route.locale}/${base}`)
  if (path) keys.add(`virtual:clarify-page/${path}`)
  else keys.add('virtual:clarify-page/index')
  if (!route.locale && base) keys.add(`virtual:clarify-page/${base}`)

  return [...keys]
}

export class OpenAPIPluginState {
  private readonly specModules = new Map<string, OpenAPISpec>()

  async enrichRoutes(routes: ContentRoute[], ctx: ClarifyHookContext): Promise<ContentRoute[]> {
    this.specModules.clear()
    const specByFilePath = new Map<string, OpenAPISpec>()

    for (const route of routes) {
      if (route.kind !== 'openapi') continue
      const specFromCache = specByFilePath.get(route.source.filePath)
      const processor = createProjectContentProcessor(ctx.plugins, ctx)
      const result = specFromCache
        ? { ok: true as const, spec: specFromCache }
        : await readOpenAPISpec(route.source.filePath, processor, ctx.generateOptions.projectRoot)
      if (!result.ok) {
        route.diagnostic = result.diagnostic
        route.meta.title = route.meta.title || 'OpenAPI parse error'
        route.meta.sections = []
        continue
      }

      const spec = normalizeOpenAPISpecSectionIds(result.spec)
      specByFilePath.set(route.source.filePath, spec)
      const sourceSpecId = sourceSpecIdFromPath(route.source.filePath, ctx.generateOptions.projectRoot)
      route.openapi = { ...route.openapi, sourceSpecId }

      route.meta.title = spec.info?.title ?? route.meta.title
      route.meta.description = spec.info?.description ?? route.meta.description
      route.meta.sections = extractOpenAPISections(spec, route.openapi.tagFilter)

      const pageSpec = route.openapi.tagFilter?.length ? filterSpecByTags(spec, route.openapi.tagFilter) : spec
      const routeSpecModuleId = routeSpecModuleIdFromSourceSpecId(sourceSpecId, route.openapi.tagFilter)
      route.openapi.routeSpecModuleId = routeSpecModuleId
      this.specModules.set(routeSpecModuleId, pageSpec)
      route.source.content = JSON.stringify(pageSpec)
    }

    return routes
  }

  contributeModules(modules: VirtualModules, routes: ContentRoute[]): VirtualModules {
    const registryEntries: Record<string, string> = {}
    const serverRegistryEntries: Record<string, OpenAPISpec> = {}

    for (const route of routes) {
      if (route.kind !== 'openapi' || !route.openapi?.sourceSpecId) continue
      const routeSpecModuleId = route.openapi.routeSpecModuleId ?? route.openapi.sourceSpecId
      const spec = this.specModules.get(routeSpecModuleId)
      if (!spec) continue

      for (const registryKey of openAPIRegistryKeys(route)) {
        registryEntries[registryKey] = specVirtualModuleId(routeSpecModuleId)
        serverRegistryEntries[registryKey] = spec
      }
    }

    modules.set(openApiRegistryModuleId, generateOpenAPIRegistryModule(registryEntries))
    modules.set(openApiServerRegistryModuleId, generateOpenAPIServerRegistryModule(serverRegistryEntries))
    for (const [routeSpecModuleId, spec] of this.specModules) {
      modules.set(specVirtualModuleId(routeSpecModuleId), generateOpenAPISpecModule(spec))
    }

    for (const route of routes) {
      if (route.kind !== 'openapi') continue
      if (route.diagnostic) {
        modules.set(route.module.pageVirtualModuleId, generateContentDiagnosticModule(route.diagnostic))
        continue
      }
      if (!route.openapi?.sourceSpecId) continue
      const routeSpecModuleId = route.openapi.routeSpecModuleId ?? route.openapi.sourceSpecId
      if (!this.specModules.has(routeSpecModuleId)) continue
      modules.set(route.module.pageVirtualModuleId, generateOpenAPIPageModule({
        specModuleId: specVirtualModuleId(routeSpecModuleId),
      }))
    }

    return modules
  }
}
