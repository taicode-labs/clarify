import { describe, it, expect } from 'vitest'

import type { ClarifyPlugin, ClarifyHookContext, ClarifyPage } from '../../types.js'
import { resolveThemeConfig } from '../site/theme.js'

import { runHooks } from './hooks.js'

const mockCtx: ClarifyHookContext = {
  projectRoot: '/site',
  contentRoot: '/site/source',
  projectConfig: {
    title: 'Test',
    description: '',
    routePrefix: '/',
    assetPrefix: '/',
    theme: resolveThemeConfig(),
    variables: {},
  },
  generateOptions: {
    projectRoot: '/site',
    rootDirectory: 'source',
    outputDirectory: 'dist',
    ssg: { failOnError: true },
  },
  version: 'test',
  routes: [],
  navigation: [],
  plugins: [],
}

describe('runHooks', () => {
  it('returns input when no plugins provided', async () => {
    const input: ClarifyPage[] = [{ path: '/', filePath: 'a.mdx', frontmatter: {}, content: '' }]
    const result = await runHooks([], 'pages:resolved', input, mockCtx)
    expect(result).toEqual(input)
  })

  it('returns input when no matching hook', async () => {
    const plugins: ClarifyPlugin[] = [
      { name: 'noop', hooks: {} },
    ]
    const input: ClarifyPage[] = [{ path: '/', filePath: 'a.mdx', frontmatter: {}, content: '' }]
    const result = await runHooks(plugins, 'pages:resolved', input, mockCtx)
    expect(result).toEqual(input)
  })

  it('runs a single hook and returns its result', async () => {
    const plugins: ClarifyPlugin[] = [
      {
        name: 'double',
        hooks: {
          'pages:resolved': (pages) => pages.map(p => ({ ...p, content: p.content + p.content })),
        },
      },
    ]
    const input: ClarifyPage[] = [
      { path: '/', filePath: 'a.mdx', frontmatter: {}, content: 'x' },
      { path: '/b', filePath: 'b.mdx', frontmatter: {}, content: 'y' },
    ]
    const result = await runHooks(plugins, 'pages:resolved', input, mockCtx)
    expect(result.map(r => r.content)).toEqual(['xx', 'yy'])
  })

  it('chains multiple hooks in order', async () => {
    const plugins: ClarifyPlugin[] = [
      {
        name: 'add-one',
        hooks: {
          'pages:resolved': (pages) => pages.map(p => ({ ...p, content: p.content + '1' })),
        },
      },
      {
        name: 'add-two',
        hooks: {
          'pages:resolved': (pages) => pages.map(p => ({ ...p, content: p.content + '2' })),
        },
      },
    ]
    const input: ClarifyPage[] = [
      { path: '/', filePath: 'a.mdx', frontmatter: {}, content: 'x' },
    ]
    const result = await runHooks(plugins, 'pages:resolved', input, mockCtx)
    expect(result[0].content).toBe('x12')
  })

  it('throws with plugin name and hook name on failure', async () => {
    const plugins: ClarifyPlugin[] = [
      {
        name: 'bad',
        hooks: {
          'pages:resolved': () => {
            throw new Error('boom')
          },
        },
      },
    ]
    await expect(runHooks(plugins, 'pages:resolved', [], mockCtx)).rejects.toThrow(
      '[clarify] plugin "bad" hook "pages:resolved" failed: Error: boom'
    )
  })

  it('supports async hooks', async () => {
    const plugins: ClarifyPlugin[] = [
      {
        name: 'async',
        hooks: {
          'pages:resolved': async (pages) => pages.map(p => ({ ...p, content: p.content + '!' })),
        },
      },
    ]
    const input: ClarifyPage[] = [
      { path: '/', filePath: 'a.mdx', frontmatter: {}, content: 'hello' },
    ]
    const result = await runHooks(plugins, 'pages:resolved', input, mockCtx)
    expect(result.map(r => r.content)).toEqual(['hello!'])
  })
})
