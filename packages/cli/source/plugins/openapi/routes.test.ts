import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { resolveProjectConfig } from '../../core/config/config.js'
import { contentRoute, testI18n } from '../../parsers/routes/routes.test-utils.js'

import { discoverOpenAPIRoutes, expandConfiguredOpenAPIRoutes } from './routes.js'

describe('OpenAPI routes', () => {
  let contentRoot: string

  beforeEach(() => {
    contentRoot = mkdtempSync(join(tmpdir(), 'clarify-openapi-routes-'))
  })

  afterEach(() => {
    rmSync(contentRoot, { recursive: true, force: true })
  })

  it('creates locale-specific page identities for fallback routes', () => {
    const localeRoot = join(contentRoot, 'zh-CN')
    mkdirSync(localeRoot)
    writeFileSync(join(localeRoot, 'api.openapi.json'), '{}')

    const routes = discoverOpenAPIRoutes(contentRoot, testI18n)

    expect(routes).toHaveLength(2)
    expect(routes.find(route => route.locale === 'zh-CN')).toMatchObject({
      path: '/zh-CN/api',
      basePath: '/api',
      module: { pageVirtualModuleId: 'virtual:clarify-page/zh-CN/api' },
    })
    expect(routes.find(route => route.locale === 'en-US')).toMatchObject({
      path: '/en-US/api',
      basePath: '/api',
      isFallback: true,
      module: { pageVirtualModuleId: 'virtual:clarify-page/en-US/api' },
      source: { filePath: join(localeRoot, 'api.openapi.json') },
    })
  })

  it('expands only OpenAPI routes for configured OpenAPI page intents', () => {
    const routes = [
      contentRoute({ path: '/api', kind: 'openapi', pageVirtualModuleId: 'virtual:clarify-page/api' }),
      contentRoute({ path: '/guide', pageVirtualModuleId: 'virtual:clarify-page/guide' }),
    ]
    const config = resolveProjectConfig({
      navigation: { tabs: [{ tab: 'API', pages: [{ group: 'Reference', pages: [{ openapi: 'api.openapi.json', path: 'reference' }] }] }] },
    })

    const expanded = expandConfiguredOpenAPIRoutes(routes, config)

    expect(expanded.map(route => [route.kind, route.path])).toEqual([
      ['openapi', '/api'],
      ['markdown+jsx', '/guide'],
      ['openapi', '/reference'],
    ])
    expect(expanded[2]?.module.pageVirtualModuleId).toBe('virtual:clarify-page/reference')
  })

  it('applies operation order to the default OpenAPI route', () => {
    const routes = [
      contentRoute({ path: '/api', kind: 'openapi', pageVirtualModuleId: 'virtual:clarify-page/api' }),
    ]
    const config = resolveProjectConfig({
      navigation: { tabs: [{ tab: 'API', pages: [{ group: 'Reference', pages: [{ openapi: 'api.openapi.json', operationOrder: ['createUser', 'getUser'] }] }] }] },
    })

    const expanded = expandConfiguredOpenAPIRoutes(routes, config)

    expect(expanded).toHaveLength(1)
    expect(expanded[0]).toMatchObject({
      path: '/api',
      openapi: { operationOrder: ['createUser', 'getUser'] },
    })
  })

  it('stores the configured localized title for the default OpenAPI route', () => {
    const routes = [
      contentRoute({ path: '/en-US/api', basePath: '/api', locale: 'en-US', kind: 'openapi', pageVirtualModuleId: 'virtual:clarify-page/en-US/api' }),
    ]
    const config = resolveProjectConfig({
      locales: testI18n,
      navigation: { tabs: [{ tab: 'API', pages: [{ group: 'Reference', pages: [{ openapi: 'api.openapi.json', title: { 'zh-CN': '完整 API 参考', 'en-US': 'Complete API Reference' } }] }] }] },
    })

    const expanded = expandConfiguredOpenAPIRoutes(routes, config)

    expect(expanded[0]?.openapi?.configuredTitle).toBe('Complete API Reference')
  })

  it('stores the configured localized title for derived tag routes', () => {
    const routes = [
      contentRoute({ path: '/api', basePath: '/api', kind: 'openapi', pageVirtualModuleId: 'virtual:clarify-page/api' }),
    ]
    const config = resolveProjectConfig({
      navigation: { tabs: [{ tab: 'API', pages: [{ group: 'Reference', pages: [{ openapi: 'api.openapi.json', filter: { tags: ['Pages'] }, title: { 'zh-CN': '页面接口', 'en-US': 'Pages API' } }] }] }] },
    })

    const expanded = expandConfiguredOpenAPIRoutes(routes, config)

    expect(expanded).toHaveLength(2)
    expect(expanded[1]).toMatchObject({
      path: '/api/pages',
      openapi: { tagFilter: ['Pages'], configuredTitle: '页面接口' },
    })
  })
})
