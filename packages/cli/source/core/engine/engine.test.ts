import type { ViteDevServer } from 'vite'
import { describe, expect, it } from 'vitest'

import { assertNoContentDiagnostics, assertNoRouteConflicts, ClarifyEngine, createDevRouteConflictRoutes } from './engine.js'

function createEngineWithHooks(calls: string[]): ClarifyEngine {
  const engine = new ClarifyEngine({ projectRoot: '/site' })
  engine.ctx.plugins = [
    {
      name: 'phase-test',
      hooks: {
        'before:build': () => {
          calls.push('before:build')
        },
        'after:build': () => {
          calls.push('after:build')
        },
        'before:dev:server': () => {
          calls.push('before:dev:server')
        },
        'dev:configureServer': () => {
          calls.push('dev:configureServer')
        },
        'after:dev:server': () => {
          calls.push('after:dev:server')
        },
      },
    },
  ]
  return engine
}

describe('ClarifyEngine phase hooks', () => {
  it('rejects discovered content diagnostics with a route summary', () => {
    expect(() => assertNoContentDiagnostics([
      {
        path: '/broken',
        kind: 'markdown+jsx',
        meta: { title: 'Broken' },
        module: {
          pageVirtualModuleId: 'virtual:clarify-page/broken',
          contentVirtualModuleId: 'virtual:clarify-content/broken.mdx',
        },
        source: { filePath: '/site/source/broken.mdx' },
        diagnostic: {
          kind: 'markdown+jsx',
          title: 'MDX syntax error',
          message: 'Invalid JSX',
          filePath: 'source/broken.mdx',
        },
      },
    ])).toThrow('[clarify] Content diagnostics prevented the build:\n- /broken: MDX syntax error (source/broken.mdx)')
  })

  it('accepts routes without content diagnostics', () => {
    expect(() => assertNoContentDiagnostics([])).not.toThrow()
  })

  it('rejects routes that would overwrite a page path', () => {
    expect(() => assertNoRouteConflicts([
      {
        path: '/api',
        kind: 'markdown',
        meta: { title: 'API' },
        module: {
          pageVirtualModuleId: 'virtual:clarify-page/api',
          contentVirtualModuleId: 'virtual:clarify-content/api.md',
        },
        source: { filePath: '/site/source/api.md' },
      },
      {
        path: '/api',
        kind: 'openapi',
        meta: { title: 'API reference' },
        module: { pageVirtualModuleId: 'virtual:clarify-page/api' },
        source: { filePath: '/site/source/api.openapi.json' },
      },
    ])).toThrow('[clarify] Route conflicts prevent the site from being built:\n- path /api: markdown /site/source/api.md, openapi /site/source/api.openapi.json')
  })

  it('rejects routes that reuse a virtual page module for different paths', () => {
    expect(() => assertNoRouteConflicts([
      {
        path: '/api',
        kind: 'openapi',
        meta: { title: 'API' },
        module: { pageVirtualModuleId: 'virtual:clarify-page/shared' },
        source: { filePath: '/site/source/api.openapi.json' },
      },
      {
        path: '/reference',
        kind: 'openapi',
        meta: { title: 'Reference' },
        module: { pageVirtualModuleId: 'virtual:clarify-page/shared' },
        source: { filePath: '/site/source/api.openapi.json' },
      },
    ])).toThrow('page module virtual:clarify-page/shared')
  })

  it('turns route conflicts into a single diagnostic page in dev mode', () => {
    const routes = createDevRouteConflictRoutes([
      {
        path: '/api',
        kind: 'markdown',
        meta: { title: 'API' },
        module: {
          pageVirtualModuleId: 'virtual:clarify-page/api',
          contentVirtualModuleId: 'virtual:clarify-content/api.md',
        },
        source: { filePath: '/site/source/api.md' },
      },
      {
        path: '/api',
        kind: 'openapi',
        meta: { title: 'API reference' },
        module: { pageVirtualModuleId: 'virtual:clarify-page/api' },
        source: { filePath: '/site/source/api.openapi.json' },
      },
    ])

    expect(routes).toHaveLength(1)
    expect(routes[0]?.diagnostic).toMatchObject({
      kind: 'route-load',
      title: 'Route conflict',
      message: 'This page cannot be rendered because path /api is used by multiple routes.',
    })
    expect(routes[0]?.diagnostic?.details).toContain('/site/source/api.openapi.json')
    expect(routes[0]?.module.pageVirtualModuleId).toBe('virtual:clarify-page/api__conflict')
  })

  it('wraps project config initialization with config phase hooks', async () => {
    const calls: string[] = []
    const engine = new ClarifyEngine({
      projectRoot: '/site',
      plugins: [
        {
          name: 'config-phase',
          hooks: {
            'before:config:load': () => {
              calls.push('before:config:load')
            },
            'after:config:load': () => {
              calls.push('after:config:load')
            },
            'before:config:resolve': () => {
              calls.push('before:config:resolve')
            },
            'after:config:resolve': () => {
              calls.push('after:config:resolve')
            },
            'before:plugins:load': () => {
              calls.push('before:plugins:load')
            },
          },
        },
      ],
    })

    await engine.initialize()

    expect(calls).toEqual([
      'before:config:load',
      'after:config:load',
      'before:config:resolve',
      'after:config:resolve',
      'before:plugins:load',
    ])
  })

  it('runs build phase tap hooks through explicit build boundaries', async () => {
    const calls: string[] = []
    const engine = createEngineWithHooks(calls)

    await expect(engine.beginBuild()).resolves.toBe(true)
    calls.push('build')
    await engine.endBuild()

    expect(calls).toEqual(['before:build', 'build', 'after:build'])
  })

  it('skips core build work when build:shouldRun vetoes', async () => {
    const calls: string[] = []
    const engine = new ClarifyEngine({ projectRoot: '/site' })
    engine.ctx.plugins = [
      {
        name: 'build-veto',
        hooks: {
          'build:shouldRun': () => {
            calls.push('build:shouldRun')
            return false
          },
          'before:build': () => {
            calls.push('before:build')
          },
          'after:build': () => {
            calls.push('after:build')
          },
          'build:assets': () => {
            calls.push('build:assets')
            return [{ fileName: 'asset.txt', source: 'asset' }]
          },
          'build:done': () => {
            calls.push('build:done')
          },
        },
      },
    ]

    await expect(engine.beginBuild()).resolves.toBe(false)
    expect(engine.shouldRunBuild()).toBe(false)
    await engine.endBuild()
    await expect(engine.collectBuildAssets()).resolves.toEqual([])
    await engine.runBuildDone()

    expect(calls).toEqual(['build:shouldRun'])
  })

  it('wraps dev server configuration with dev server phase hooks', async () => {
    const calls: string[] = []
    const engine = createEngineWithHooks(calls)

    await engine.configureDevServer({} as ViteDevServer)

    expect(calls).toEqual(['before:dev:server', 'dev:configureServer', 'after:dev:server'])
  })

  it('runs build:done after the ssg phase completes', async () => {
    const calls: string[] = []
    const engine = new ClarifyEngine({ projectRoot: '/site' })
    engine.ctx.plugins = [
      {
        name: 'ssg-phase',
        hooks: {
          'before:ssg': () => {
            calls.push('before:ssg')
          },
          'after:ssg': () => {
            calls.push('after:ssg')
          },
          'build:done': () => {
            calls.push('build:done')
          },
        },
      },
    ]

    process.env.SKIP_CLARIFY_SSG = '1'
    try {
      await engine.runSSG()
    } finally {
      delete process.env.SKIP_CLARIFY_SSG
    }

    expect(calls).toEqual(['before:ssg', 'after:ssg', 'build:done'])
  })
})
