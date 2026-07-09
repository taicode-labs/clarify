import { describe, expect, it } from 'vitest'

import { loadBuildPlugins, loadPlugins } from './manager.js'

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

    expect(plugins.at(-1)?.name).toBe('user-plugin')
    expect(plugins.some(plugin => plugin.name === 'clarify:html-shell')).toBe(true)
  })
})
