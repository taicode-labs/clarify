import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it, afterEach, beforeEach } from 'vitest'

import type { ClarifyHookContext, ContentRoute, ResolvedBuildOptions, ResolvedProjectConfig } from '../../types.js'

import { createOpenAPIPlugin } from './index.js'

const projectConfig: ResolvedProjectConfig = {
  title: 'Test',
  description: 'Test docs',
  routePrefix: '/',
  theme: { primary: '#000000' },
}

const generateOptions: ResolvedBuildOptions = {
  rootDirectory: 'source',
  outputDirectory: 'output',
  ssg: { failOnError: true },
}

function createContext(routes: ContentRoute[]): ClarifyHookContext {
  return {
    projectConfig,
    generateOptions,
    routes,
    navigation: [],
  }
}

describe('createOpenAPIPlugin', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clarify-openapi-plugin-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('discovers, enriches, and contributes OpenAPI virtual modules', async () => {
    const specPath = join(tempDir, 'api.openapi.json')
    writeFileSync(specPath, JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Plugin API', version: '1.0.0' },
      paths: {
        '/users': {
          get: {
            summary: 'List users',
            tags: ['Users'],
          },
        },
      },
    }), 'utf-8')

    const plugin = createOpenAPIPlugin()
    const discoveredInput = await plugin.hooks?.['routes:discover']?.({
      contentRoot: tempDir,
      routes: [],
    }, createContext([]))
    const routes = discoveredInput?.routes ?? []

    expect(routes).toMatchObject([{
      path: '/api',
      filePath: specPath,
      virtualModuleId: 'virtual:clarify-page/api',
      kind: 'openapi',
    }])

    const discovered = await plugin.hooks?.['routes:discovered']?.(routes, createContext(routes))

    expect(discovered?.[0].title).toBe('Plugin API')
    expect(discovered?.[0].sections).toEqual([
      { id: 'get-users', title: 'List users', badge: 'GET', level: 2 },
    ])

    const modules = await plugin.hooks?.['modules:before']?.(new Map(), createContext(routes))
    expect(modules?.get('virtual:clarify-openapi-registry')).toContain('Plugin API')
    expect(modules?.get('virtual:clarify-page/api')).toContain('OpenApiPage')
  })

  it('throws when an OpenAPI route cannot be parsed', async () => {
    const specPath = join(tempDir, 'broken.openapi.json')
    writeFileSync(specPath, '{ invalid json', 'utf-8')

    const routes: ContentRoute[] = [{
      path: '/broken',
      title: 'Broken',
      filePath: specPath,
      virtualModuleId: 'virtual:clarify-page/broken',
      kind: 'openapi',
    }]
    const plugin = createOpenAPIPlugin()

    await expect(plugin.hooks?.['routes:discovered']?.(routes, createContext(routes)))
      .rejects.toThrow('Failed to parse OpenAPI spec')
  })
})
