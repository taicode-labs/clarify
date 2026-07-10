import type { ViteDevServer } from 'vite'
import { describe, expect, it } from 'vitest'

import { ClarifyEngine } from './engine.js'

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
