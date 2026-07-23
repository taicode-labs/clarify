import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { resolveFeaturesConfig } from '../../core/config/config.js'
import { resolveThemeConfig } from '../../parsers/theme.js'
import type { ClarifyHookContext, ContentRoute, OpenAPIContentRoute } from '../../types.js'

import { createOpenAPIPlugin } from './index.js'

function createRoute(filePath: string): OpenAPIContentRoute {
  return {
    path: '/api',
    kind: 'openapi',
    meta: { title: 'API' },
    module: { pageVirtualModuleId: 'virtual:clarify-page/api' },
    source: { filePath },
  }
}

function createContext(routes: ContentRoute[], projectRoot: string): ClarifyHookContext {
  return {
    projectRoot,
    contentRoot: projectRoot,
    projectConfig: {
      title: 'Test', description: 'Test docs', routePrefix: '/', assetPrefix: '/', theme: resolveThemeConfig(), variables: {}, features: resolveFeaturesConfig({ openapi: false }),
    },
    generateOptions: { projectRoot, rootDirectory: 'source', outputDirectory: 'output' },
    version: 'test',
    routes,
    navigation: { kind: 'flat', nodes: [] },
    plugins: [],
    get: () => undefined,
    set: () => undefined,
    has: () => false,
    delete: () => false,
  }
}

describe('OpenAPI plugin when disabled', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-openapi-disabled-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('skips OpenAPI routes and contributes empty registries', async () => {
    const specPath = join(tempDir, 'api.openapi.json')
    writeFileSync(specPath, JSON.stringify({ openapi: '3.0.0', info: { title: 'Disabled API', version: '1.0.0' }, paths: {} }), 'utf-8')

    const plugin = createOpenAPIPlugin()
    const existingRoutes: ContentRoute[] = [createRoute(specPath)]
    const context = createContext(existingRoutes, tempDir)

    const discoveredInput = await plugin.hooks?.['routes:discover']?.({ contentRoot: tempDir, routes: [] }, context)
    expect(discoveredInput?.routes).toEqual([])

    const discovered = await plugin.hooks?.['routes:discovered']?.(existingRoutes, context)
    expect(discovered).toEqual([])

    const modules = await plugin.hooks?.['modules:before']?.(new Map(), { ...context, routes: discovered ?? [] })
    const clientModule = await import(`data:text/javascript,${encodeURIComponent(modules?.get('virtual:clarify/openapi') ?? '')}`)
    const serverModule = await import(`data:text/javascript,${encodeURIComponent(modules?.get('virtual:clarify/openapi/server') ?? '')}`)
    expect(clientModule.openApiSpecs).toEqual({})
    expect(serverModule.openApiSpecs).toEqual({})
  })
})
