import { describe, expect, it, vi } from 'vitest'

import { resolveProjectConfig } from '../../core/config/config.js'
import type { ClarifyArdConfig, ClarifyHtmlTransformInput, ContentRoute, OpenAPIContentRoute, ResolvedProjectConfig } from '../../types.js'

import { createArdPlugin } from './index.js'

function openAPIRoute(path = '/payments'): OpenAPIContentRoute {
  return {
    path,
    kind: 'openapi',
    meta: { title: 'Payments API' },
    module: { pageVirtualModuleId: 'virtual:clarify-page/payments' },
    source: {
      filePath: '/tmp/payments.openapi.json',
      content: JSON.stringify({ openapi: '3.1.0', info: { title: 'Payments API', version: '2.1.0' }, paths: {} }),
    },
    artifacts: { contentArtifactUrl: '/payments.openapi.json' },
  }
}

function config(ard: ClarifyArdConfig | boolean = true, routePrefix = '/'): ResolvedProjectConfig {
  return resolveProjectConfig({ siteUrl: 'https://docs.example.com', routePrefix, features: { ard } })
}

function htmlInput(html = '<html><head></head><body></body></html>'): ClarifyHtmlTransformInput {
  return { html, tags: [], clientEntryId: '/entry.js', dev: false }
}

async function runBuildAssets(projectConfig: ResolvedProjectConfig, routes: ContentRoute[]) {
  const hook = createArdPlugin().hooks?.['build:assets']
  if (!hook) throw new Error('build:assets hook is missing')
  return hook({ projectConfig, routes } as never)
}

describe('ARD plugin', () => {
  it('emits the discovery manifest as a build asset', async () => {
    const assets = await runBuildAssets(config(), [openAPIRoute()])

    expect(assets.map(asset => asset.fileName)).toEqual(['.well-known/ard.json'])
    const manifest = JSON.parse(String(assets[0]?.source)) as { entries: Array<{ identifier: string; url: string }> }
    expect(manifest.entries).toContainEqual(expect.objectContaining({
      identifier: 'urn:air:docs.example.com:openapi:payments',
      url: 'https://docs.example.com/payments.openapi.json',
    }))
    expect(manifest.entries).toContainEqual(expect.objectContaining({
      identifier: 'urn:air:docs.example.com:openapi:root',
      url: 'https://docs.example.com/openapi.json',
    }))
  })

  it('emits no manifest while disabled or when nothing is publishable', async () => {
    expect(await runBuildAssets(resolveProjectConfig({ siteUrl: 'https://docs.example.com', features: { ard: false } }), [openAPIRoute()])).toEqual([])
    expect(await runBuildAssets(config(), [])).toEqual([])
  })

  it('injects a rel="ard" link into the document head', async () => {
    const hook = createArdPlugin().hooks?.['html:transform']
    if (!hook) throw new Error('html:transform hook is missing')

    const result = await hook(htmlInput(), { projectConfig: config(true, '/docs/'), routes: [openAPIRoute()] } as never)

    expect(result.tags).toEqual([
      {
        tag: 'link',
        attrs: { rel: 'ard', href: 'https://docs.example.com/docs/.well-known/ard.json' },
        injectTo: 'head',
      },
    ])
  })

  it('keeps a rel="ard" link already present in the document', async () => {
    const hook = createArdPlugin().hooks?.['html:transform']
    if (!hook) throw new Error('html:transform hook is missing')
    const input = htmlInput('<html><head><link rel="ard" href="/custom.json"></head><body></body></html>')

    const result = await hook(input, { projectConfig: config(), routes: [openAPIRoute()] } as never)

    expect(result).toBe(input)
    expect(result.tags).toEqual([])
  })

  it('adds no link when no resources are discoverable', async () => {
    const hook = createArdPlugin().hooks?.['html:transform']
    if (!hook) throw new Error('html:transform hook is missing')
    const input = htmlInput()

    await expect(hook(input, { projectConfig: config(), routes: [] } as never)).toBe(input)
  })

  it('serves the manifest in development under the route prefix', async () => {
    let middleware: ((req: unknown, res: unknown, next: () => void) => void) | undefined
    const use = vi.fn((handler: typeof middleware) => { middleware = handler })
    const configureServer = createArdPlugin().hooks?.['dev:configureServer']
    if (!configureServer) throw new Error('dev:configureServer hook is missing')

    const postHook = await configureServer({ middlewares: { use } } as never, {
      projectConfig: config(true, '/docs/'),
      routes: [openAPIRoute()],
    } as never)
    expect(use).not.toHaveBeenCalled()
    postHook?.()

    const headers = new Map<string, string>()
    let body = ''
    const next = vi.fn()
    middleware?.(
      { url: '/docs/.well-known/ard.json' },
      { statusCode: 0, setHeader: (name: string, value: string) => headers.set(name, value), end: (value: string) => { body = value } },
      next,
    )

    expect(next).not.toHaveBeenCalled()
    expect(headers.get('Content-Type')).toBe('application/json; charset=utf-8')
    expect(JSON.parse(body).entries.at(-1).identifier).toBe('urn:air:docs.example.com:openapi:payments')
  })

  it('falls through for unrelated development requests', async () => {
    let middleware: ((req: unknown, res: unknown, next: () => void) => void) | undefined
    const configureServer = createArdPlugin().hooks?.['dev:configureServer']
    if (!configureServer) throw new Error('dev:configureServer hook is missing')
    const postHook = await configureServer({ middlewares: { use: (handler: typeof middleware) => { middleware = handler } } } as never, {
      projectConfig: config(),
      routes: [openAPIRoute()],
    } as never)
    postHook?.()

    const next = vi.fn()
    middleware?.({ url: '/guide' }, {}, next)

    expect(next).toHaveBeenCalledOnce()
  })
})
