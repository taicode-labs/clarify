import { EventEmitter } from 'node:events'
import type { IncomingMessage } from 'node:http'

import { describe, it, expect } from 'vitest'

import { resolveThemeConfig } from '../../parsers/theme.js'
import type { ClarifyProjectContext, ContentRoute, ResolvedProjectConfig } from '../../types.js'

import {
  toDevRouteEntry,
  resolveRouteForFile,
  inferRouteForFile,
  handleDevRouteRequest,
} from './dev-routes.js'

type RouteFixture = Partial<Omit<ContentRoute, 'meta' | 'module' | 'source'>> & {
  title?: string
  filePath?: string
  virtualModuleId?: string
}

function makeRoute(overrides: RouteFixture): ContentRoute {
  const { title, filePath, virtualModuleId, ...rest } = overrides
  return {
    path: '/x',
    kind: 'mdx',
    meta: { title: title ?? 'X' },
    module: { virtualModuleId: virtualModuleId ?? 'virtual:clarify-page/x' },
    source: { filePath: filePath ?? '/site/source/x.mdx' },
    ...rest,
  }
}

const mockProjectConfig: ResolvedProjectConfig = {
  title: 'Test',
  description: '',
  routePrefix: '/',
  assetPrefix: '/',
  theme: resolveThemeConfig(),
  variables: {},
}

const mockI18nProjectConfig: ResolvedProjectConfig = {
  ...mockProjectConfig,
  i18n: {
    defaultLocale: 'en-US',
    missing: 'fallback',
    locales: [
      { code: 'en-US', label: 'English' },
      { code: 'zh-CN', label: '中文' },
    ],
  },
}

const CONTENT_ROOT = '/site/source'

const mockContext: ClarifyProjectContext = {
  projectRoot: '/site',
  contentRoot: CONTENT_ROOT,
  projectConfig: mockProjectConfig,
  generateOptions: {
    projectRoot: '/site',
    rootDirectory: 'source',
    outputDirectory: undefined,
    ssg: { failOnError: true },
  },
  version: 'test',
}

const mockI18nContext: ClarifyProjectContext = {
  ...mockContext,
  projectConfig: mockI18nProjectConfig,
}

function mockRes() {
  const chunks: Buffer[] = []
  const headers: Record<string, string> = {}
  return {
    res: {
      setHeader(name: string, value: string) { headers[name] = value },
      end(data: string) { chunks.push(Buffer.from(data)) },
    } as unknown as import('node:http').ServerResponse,
    headers,
    body: () => JSON.parse(Buffer.concat(chunks).toString('utf-8')),
  }
}

/** Create a mock IncomingMessage that emits the given JSON body. */
function mockReq(body: unknown = {}): IncomingMessage {
  const json = JSON.stringify(body)
  const emitter = new EventEmitter() as IncomingMessage
  process.nextTick(() => {
    emitter.emit('data', Buffer.from(json))
    emitter.emit('end')
  })
  return emitter
}

describe('toDevRouteEntry', () => {
  it('serializes a route to the minimal dev shape', () => {
    const route = makeRoute({ path: '/about', filePath: '/a/about.mdx', locale: 'en-US', basePath: '/about', kind: 'mdx', title: 'About' })
    expect(toDevRouteEntry(route)).toEqual({
      path: '/about',
      filePath: '/a/about.mdx',
      locale: 'en-US',
      basePath: '/about',
      kind: 'mdx',
      title: 'About',
    })
  })
})

describe('resolveRouteForFile', () => {
  it('returns undefined when no route matches', () => {
    expect(resolveRouteForFile('/missing.mdx', [makeRoute({})])).toBeUndefined()
  })

  it('returns the single match directly', () => {
    const route = makeRoute({ filePath: '/a/x.mdx' })
    expect(resolveRouteForFile('/a/x.mdx', [route])).toBe(route)
  })

  it('prefers the route whose locale matches the file path', () => {
    const en = makeRoute({ filePath: '/src/en-US/x.mdx', locale: 'en-US', path: '/en-US/x' })
    const zh = makeRoute({ filePath: '/src/zh-CN/x.mdx', locale: 'zh-CN', path: '/zh-CN/x' })
    // Querying the zh-CN file should return the zh-CN route even though both
    // share the same basePath.
    expect(resolveRouteForFile('/src/zh-CN/x.mdx', [en, zh], 'en-US')).toBe(zh)
  })

  it('falls back to default locale when file locale has no matching route', () => {
    // Multiple routes share the same filePath (e.g. an OpenAPI spec referenced
    // by several locale routes). The queried file path implies zh-CN but only
    // the en-US route exists — should fall back to the default locale.
    const en = makeRoute({ filePath: '/src/api.openapi.json', locale: 'en-US', path: '/en-US/api' })
    expect(resolveRouteForFile('/src/zh-CN/api.openapi.json', [en], 'en-US')).toBeUndefined()
  })

  it('falls back to default locale among same-file routes when file locale is absent', () => {
    const en = makeRoute({ filePath: '/src/api.openapi.json', locale: 'en-US', path: '/en-US/api' })
    const fr = makeRoute({ filePath: '/src/api.openapi.json', locale: 'fr-FR', path: '/fr-FR/api' })
    // File path has no recognizable locale segment; default locale (en-US) wins.
    expect(resolveRouteForFile('/src/api.openapi.json', [en, fr], 'en-US')).toBe(en)
  })

  it('falls back to first match when no locale info is available', () => {
    const a = makeRoute({ filePath: '/a/x.mdx', path: '/x' })
    const b = makeRoute({ filePath: '/a/x.mdx', path: '/x-alt' })
    expect(resolveRouteForFile('/a/x.mdx', [a, b])).toBe(a)
  })
})

describe('inferRouteForFile', () => {
  it('derives a localized path for an unregistered mdx file', () => {
    const entry = inferRouteForFile('/site/source/zh-CN/drafts/new.mdx', CONTENT_ROOT, 'en-US')
    expect(entry).toMatchObject({
      path: '/zh-CN/drafts/new',
      basePath: '/drafts/new',
      locale: 'zh-CN',
      kind: 'mdx',
      inferred: true,
    })
  })

  it('derives a non-localized path when i18n is not configured', () => {
    const entry = inferRouteForFile('/site/source/drafts/new.mdx', CONTENT_ROOT)
    expect(entry).toMatchObject({
      path: '/drafts/new',
      basePath: '/drafts/new',
      kind: 'mdx',
      inferred: true,
    })
    expect(entry?.locale).toBeUndefined()
  })

  it('returns null for files outside the content root', () => {
    expect(inferRouteForFile('/other/place/x.mdx', CONTENT_ROOT)).toBeNull()
  })

  it('returns null for non-content files', () => {
    expect(inferRouteForFile('/site/source/config.ts', CONTENT_ROOT)).toBeNull()
  })

  it('handles index.mdx as a directory path', () => {
    const entry = inferRouteForFile('/site/source/en-US/guide/index.mdx', CONTENT_ROOT, 'en-US')
    expect(entry).toMatchObject({
      path: '/en-US/guide',
      basePath: '/guide',
      locale: 'en-US',
      inferred: true,
    })
  })

  it('handles openapi files', () => {
    const entry = inferRouteForFile('/site/source/en-US/api.openapi.json', CONTENT_ROOT, 'en-US')
    expect(entry).toMatchObject({
      kind: 'openapi',
      path: '/en-US/api',
      basePath: '/api',
      inferred: true,
    })
  })
})

describe('handleDevRouteRequest', () => {
  it('returns the full route list when no file is provided', async () => {
    const routes = [
      makeRoute({ path: '/', filePath: '/a/index.mdx', title: 'Home' }),
      makeRoute({ path: '/about', filePath: '/a/about.mdx', title: 'About' }),
    ]
    const { res, body, headers } = mockRes()
    await handleDevRouteRequest(mockReq({}), res, routes, mockContext)

    expect(headers['Content-Type']).toBe('application/json; charset=utf-8')
    expect(body()).toHaveLength(2)
    expect(body()[0]).toMatchObject({ path: '/', title: 'Home' })
  })

  it('returns a single route when file matches', async () => {
    const routes = [makeRoute({ path: '/about', filePath: '/a/about.mdx', locale: 'en-US' })]
    const { res, body } = mockRes()
    await handleDevRouteRequest(mockReq({ file: '/a/about.mdx' }), res, routes, mockI18nContext)

    expect(body()).toMatchObject({ path: '/about', filePath: '/a/about.mdx', locale: 'en-US' })
  })

  it('returns an inferred route when file does not match any route', async () => {
    const routes = [makeRoute({ filePath: '/a/about.mdx' })]
    const { res, body } = mockRes()
    await handleDevRouteRequest(mockReq({ file: '/site/source/zh-CN/drafts/new.mdx' }), res, routes, mockI18nContext)

    expect(body()).toMatchObject({
      path: '/zh-CN/drafts/new',
      inferred: true,
      locale: 'zh-CN',
    })
  })

  it('returns null when file is outside content root and not a route', async () => {
    const routes = [makeRoute({ filePath: '/a/about.mdx' })]
    const { res, body } = mockRes()
    await handleDevRouteRequest(mockReq({ file: '/other/place/x.mdx' }), res, routes, mockContext)

    expect(body()).toBeNull()
  })

  it('prefers the locale matching the queried file path', async () => {
    const routes = [
      makeRoute({ filePath: '/src/en-US/x.mdx', locale: 'en-US', path: '/en-US/x' }),
      makeRoute({ filePath: '/src/zh-CN/x.mdx', locale: 'zh-CN', path: '/zh-CN/x' }),
    ]
    const { res, body } = mockRes()
    await handleDevRouteRequest(mockReq({ file: '/src/zh-CN/x.mdx' }), res, routes, mockI18nContext)

    expect(body()).toMatchObject({ path: '/zh-CN/x', locale: 'zh-CN' })
  })

  it('returns 400 on invalid JSON body', async () => {
    const routes = [makeRoute({})]
    const { res, body } = mockRes()
    const emitter = new EventEmitter() as IncomingMessage
    process.nextTick(() => {
      emitter.emit('data', Buffer.from('not json'))
      emitter.emit('end')
    })
    await handleDevRouteRequest(emitter, res, routes, mockContext)

    expect((res as unknown as { statusCode: number }).statusCode).toBe(400)
    expect(body()).toMatchObject({ error: 'Invalid JSON body' })
  })
})
