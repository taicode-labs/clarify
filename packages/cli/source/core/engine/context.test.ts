import { describe, expect, it } from 'vitest'

import { resolveProjectConfig } from '../config/config.js'
import { resolveBuildOptions } from '../config/options.js'

import { ClarifyContext } from './context.js'

function createContext(): ClarifyContext {
  return new ClarifyContext({
    projectRoot: '/site',
    contentRoot: '/site/source',
    projectConfig: resolveProjectConfig(),
    generateOptions: resolveBuildOptions({ projectRoot: '/site' }),
    version: 'test',
  })
}

describe('ClarifyContext', () => {
  it('stores plugin shared values by key', () => {
    const ctx = createContext()

    ctx.set('answer', 42)

    expect(ctx.has('answer')).toBe(true)
    expect(ctx.get<number>('answer')).toBe(42)
    expect(ctx.delete('answer')).toBe(true)
    expect(ctx.has('answer')).toBe(false)
  })

  it('notifies route and navigation listeners on replacement', () => {
    const ctx = createContext()
    const events: string[] = []

    ctx.onRoutesChange(() => events.push('routes'))
    ctx.onNavigationChange(() => events.push('navigation'))

    ctx.routes = [{
      path: '/',
      kind: 'mdx',
      meta: { title: 'Home' },
      module: { virtualModuleId: 'virtual:clarify/routes/index' },
      source: { filePath: '/site/source/index.md' },
    }]
    ctx.navigation = { kind: 'flat', nodes: [{ path: '/', title: 'Home' }] }
    ctx.plugins = [{ name: 'test' }]

    expect(events).toEqual(['routes', 'navigation'])
  })

  it('allows listeners to unsubscribe', () => {
    const ctx = createContext()
    let count = 0

    const unsubscribe = ctx.onRoutesChange(() => count += 1)
    ctx.routes = []
    unsubscribe()
    ctx.routes = []

    expect(count).toBe(1)
  })

  it('updates project state without replacing route state', () => {
    const ctx = createContext()
    ctx.routes = [{
      path: '/',
      kind: 'mdx',
      meta: { title: 'Home' },
      module: { virtualModuleId: 'virtual:clarify/routes/index' },
      source: { filePath: '/site/source/index.md' },
    }]

    ctx.updateProjectState({
      projectRoot: '/next',
      contentRoot: '/next/docs',
      version: 'next',
    })

    expect(ctx.projectRoot).toBe('/next')
    expect(ctx.contentRoot).toBe('/next/docs')
    expect(ctx.version).toBe('next')
    expect(ctx.routes).toHaveLength(1)
  })

  it('exposes i18n convenience properties', () => {
    const ctx = new ClarifyContext({
      projectRoot: '/site',
      contentRoot: '/site/source',
      projectConfig: resolveProjectConfig({
        locales: {
          default: 'en-US',
          options: [{ code: 'en-US', label: 'English' }],
        },
      }),
      generateOptions: resolveBuildOptions({ projectRoot: '/site' }),
      version: 'test',
    })

    expect(ctx.isI18n).toBe(true)
    expect(ctx.defaultLocale).toBe('en-US')
  })
})
