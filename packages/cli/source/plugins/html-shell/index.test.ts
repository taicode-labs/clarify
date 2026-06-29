import { describe, expect, it } from 'vitest'

import { resolveThemeConfig } from '../../core/theme.js'
import type { ClarifyHookContext } from '../../types.js'

import { createHtmlShellPlugin } from './index.js'

const ctx: ClarifyHookContext = {
  projectConfig: {
    title: 'Docs',
    description: '',
    routePrefix: '/',
    assetPrefix: '/',
    theme: resolveThemeConfig(),
  },
  generateOptions: {
    projectRoot: '/site',
    rootDirectory: 'source',
    outputDirectory: 'output',
    ssg: { failOnError: true },
  },
  routes: [],
  navigation: [],
}

describe('createHtmlShellPlugin', () => {
  it('injects the theme bootstrap and dev client entry scripts', async () => {
    const plugin = createHtmlShellPlugin()
    const result = await plugin.hooks?.['html:transform']?.({
      html: '<html></html>',
      tags: [],
      clientEntryId: '/@id/virtual:clarify-entry-client',
      dev: true,
    }, ctx)

    expect(result?.html).toBe('<html></html>')
    expect(result?.tags).toEqual([
      expect.objectContaining({
        tag: 'script',
        injectTo: 'head-prepend',
        children: expect.stringContaining('clarify-theme'),
      }),
      {
        tag: 'script',
        attrs: { type: 'module', src: '/@id/virtual:clarify-entry-client' },
        injectTo: 'body',
      },
    ])
  })

  it('injects the build client entry script', async () => {
    const plugin = createHtmlShellPlugin()
    const result = await plugin.hooks?.['html:transform']?.({
      html: '<html></html>',
      tags: [],
      clientEntryId: 'virtual:clarify-entry-client',
      dev: false,
    }, ctx)

    expect(result?.tags.at(1)).toEqual({
      tag: 'script',
      attrs: { type: 'module', src: 'virtual:clarify-entry-client' },
      injectTo: 'body',
    })
  })

  it('preserves existing html transform tags', async () => {
    const plugin = createHtmlShellPlugin()
    const result = await plugin.hooks?.['html:transform']?.({
      html: '<html></html>',
      tags: [{ tag: 'meta', attrs: { name: 'x' }, injectTo: 'head' }],
      clientEntryId: 'virtual:clarify-entry-client',
      dev: false,
    }, ctx)

    expect(result?.tags.at(0)).toEqual({ tag: 'meta', attrs: { name: 'x' }, injectTo: 'head' })
  })

  it('injects a configured favicon link', async () => {
    const plugin = createHtmlShellPlugin()
    const result = await plugin.hooks?.['html:transform']?.({
      html: '<html></html>',
      tags: [],
      clientEntryId: 'virtual:clarify-entry-client',
      dev: false,
    }, {
      ...ctx,
      projectConfig: {
        ...ctx.projectConfig,
        favicon: '/clarify.svg',
      },
    })

    expect(result?.tags.at(0)).toEqual({
      tag: 'link',
      attrs: { rel: 'icon', type: 'image/svg+xml', href: '/clarify.svg' },
      injectTo: 'head',
    })
  })

  it('injects media-specific favicon links', async () => {
    const plugin = createHtmlShellPlugin()
    const result = await plugin.hooks?.['html:transform']?.({
      html: '<html></html>',
      tags: [],
      clientEntryId: 'virtual:clarify-entry-client',
      dev: false,
    }, {
      ...ctx,
      projectConfig: {
        ...ctx.projectConfig,
        favicon: {
          light: '/favicon-light.png',
          dark: '/favicon-dark.png',
        },
      },
    })

    expect(result?.tags.slice(0, 2)).toEqual([
      {
        tag: 'link',
        attrs: {
          rel: 'icon',
          type: 'image/png',
          href: '/favicon-light.png',
          media: '(prefers-color-scheme: light)',
        },
        injectTo: 'head',
      },
      {
        tag: 'link',
        attrs: {
          rel: 'icon',
          type: 'image/png',
          href: '/favicon-dark.png',
          media: '(prefers-color-scheme: dark)',
        },
        injectTo: 'head',
      },
    ])
  })

  it('falls back to logo when favicon is not configured', async () => {
    const plugin = createHtmlShellPlugin()
    const result = await plugin.hooks?.['html:transform']?.({
      html: '<html></html>',
      tags: [],
      clientEntryId: 'virtual:clarify-entry-client',
      dev: false,
    }, {
      ...ctx,
      projectConfig: {
        ...ctx.projectConfig,
        logo: '/logo.svg',
      },
    })

    expect(result?.tags.at(0)).toEqual({
      tag: 'link',
      attrs: { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
      injectTo: 'head',
    })
  })

  it('does not inject duplicate favicon links when html already has one', async () => {
    const plugin = createHtmlShellPlugin()
    const result = await plugin.hooks?.['html:transform']?.({
      html: '<html><head><link rel="icon" href="/custom.ico" /></head></html>',
      tags: [],
      clientEntryId: 'virtual:clarify-entry-client',
      dev: false,
    }, {
      ...ctx,
      projectConfig: {
        ...ctx.projectConfig,
        favicon: '/clarify.svg',
      },
    })

    expect(result?.tags.some((tag) => tag.tag === 'link')).toBe(false)
  })
})
