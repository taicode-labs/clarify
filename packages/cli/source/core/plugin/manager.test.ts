import { describe, expect, it } from 'vitest'

import { loadBuildPlugins, loadPlugins, sortPlugins } from './manager.js'

describe('plugin manager', () => {
  it('loads builtin plugins before user plugins', () => {
    const plugins = loadPlugins({
      htmlShell: false,
      userPlugins: [{ name: 'user-plugin' }],
    })

    expect(plugins.map(plugin => plugin.name)).toEqual([
      'clarify:variables',
      'clarify:openapi',
      'clarify:source-links',
      'clarify:content-artifacts',
      'clarify:seo',
      'clarify:search-index',
      'user-plugin',
    ])
  })

  it('loads build plugins from build options', () => {
    const plugins = loadBuildPlugins({
      plugins: [{ name: 'user-plugin' }],
    })

    expect(plugins.some(plugin => plugin.name === 'clarify:html-shell')).toBe(true)
    expect(plugins.some(plugin => plugin.name === 'clarify:variables')).toBe(true)
    expect(plugins.some(plugin => plugin.name === 'user-plugin')).toBe(true)
  })

  it('sorts plugins by enforce, priority, and stable insertion order', () => {
    const plugins = sortPlugins([
      { name: 'default-a' },
      { name: 'post', enforce: 'post', priority: 100 },
      { name: 'pre-low', enforce: 'pre', priority: 1 },
      { name: 'pre-high', enforce: 'pre', priority: 10 },
      { name: 'default-b' },
    ])

    expect(plugins.map(plugin => plugin.name)).toEqual([
      'pre-high',
      'pre-low',
      'default-a',
      'default-b',
      'post',
    ])
  })

  it('keeps dependencies before dependent plugins', () => {
    const plugins = sortPlugins([
      { name: 'feature', priority: 10, dependsOn: ['base'] },
      { name: 'base' },
    ])

    expect(plugins.map(plugin => plugin.name)).toEqual(['base', 'feature'])
  })

  it('throws for missing plugin dependencies', () => {
    expect(() => sortPlugins([{ name: 'feature', dependsOn: ['missing'] }])).toThrow('depends on missing plugin')
  })

  it('throws for circular plugin dependencies', () => {
    expect(() => sortPlugins([
      { name: 'a', dependsOn: ['b'] },
      { name: 'b', dependsOn: ['a'] },
    ])).toThrow('Circular plugin dependency')
  })
})
