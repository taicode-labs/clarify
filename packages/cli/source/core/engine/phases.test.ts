import { describe, expect, it } from 'vitest'

import type { ClarifyHookContext, ClarifyPlugin } from '../../types.js'
import { resolveProjectConfig } from '../config/config.js'
import { resolveBuildOptions } from '../config/options.js'

import { runInterceptHooks, runPhase, runTapHooks } from './phases.js'

const mockCtx: ClarifyHookContext = {
  projectRoot: '/site',
  contentRoot: '/site/source',
  projectConfig: resolveProjectConfig(),
  generateOptions: resolveBuildOptions({ projectRoot: '/site' }),
  version: 'test',
  routes: [],
  navigation: [],
}

describe('runTapHooks', () => {
  it('runs matching tap hooks in plugin order', async () => {
    const calls: string[] = []
    const plugins: ClarifyPlugin[] = [
      {
        name: 'first',
        hooks: {
          'before:site:discover': () => {
            calls.push('first')
          },
        },
      },
      {
        name: 'second',
        hooks: {
          'before:site:discover': () => {
            calls.push('second')
          },
        },
      },
    ]

    await runTapHooks(plugins, 'before:site:discover', mockCtx)

    expect(calls).toEqual(['first', 'second'])
  })

  it('wraps hook failures with plugin and hook names', async () => {
    const plugins: ClarifyPlugin[] = [
      {
        name: 'bad',
        hooks: {
          'after:modules:build': () => {
            throw new Error('boom')
          },
        },
      },
    ]

    await expect(runTapHooks(plugins, 'after:modules:build', mockCtx)).rejects.toThrow(
      '[clarify] plugin "bad" hook "after:modules:build" failed: Error: boom'
    )
  })
})

describe('runInterceptHooks', () => {
  it('returns false when any intercept hook vetoes the phase', async () => {
    const calls: string[] = []
    const plugins: ClarifyPlugin[] = [
      {
        name: 'allow',
        hooks: {
          'ssg:shouldRun': () => {
            calls.push('allow')
            return true
          },
        },
      },
      {
        name: 'deny',
        hooks: {
          'ssg:shouldRun': () => {
            calls.push('deny')
            return false
          },
        },
      },
      {
        name: 'skipped',
        hooks: {
          'ssg:shouldRun': () => {
            calls.push('skipped')
            return true
          },
        },
      },
    ]

    await expect(runInterceptHooks(plugins, 'ssg:shouldRun', mockCtx)).resolves.toBe(false)
    expect(calls).toEqual(['allow', 'deny'])
  })

  it('returns true when no intercept hook vetoes the phase', async () => {
    const plugins: ClarifyPlugin[] = [
      { name: 'noop', hooks: {} },
      { name: 'allow', hooks: { 'build:shouldRun': () => true } },
    ]

    await expect(runInterceptHooks(plugins, 'build:shouldRun', mockCtx)).resolves.toBe(true)
  })
})

describe('runPhase', () => {
  it('wraps a task with before and after tap hooks', async () => {
    const calls: string[] = []
    const plugins: ClarifyPlugin[] = [
      {
        name: 'phase',
        hooks: {
          'before:modules:build': () => {
            calls.push('before')
          },
          'after:modules:build': () => {
            calls.push('after')
          },
        },
      },
    ]

    const result = await runPhase(plugins, 'modules:build', mockCtx, () => {
      calls.push('task')
      return 'done'
    })

    expect(result).toBe('done')
    expect(calls).toEqual(['before', 'task', 'after'])
  })
})
