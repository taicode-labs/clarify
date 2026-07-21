import { describe, expect, it } from 'vitest'

import { contentRoute } from '../../parsers/routes/routes.test-utils.js'
import type { ClarifyPlugin } from '../../types.js'
import { resolveProjectConfig } from '../config/config.js'
import { resolveBuildOptions } from '../config/options.js'
import { ClarifyContext } from '../engine/context.js'

import { resolveRoutePages, resolveRouteState } from './route-resolution.js'

function createContext(): ClarifyContext {
  return new ClarifyContext({
    projectRoot: '/site',
    contentRoot: '/site/source',
    projectConfig: resolveProjectConfig(),
    generateOptions: resolveBuildOptions({ projectRoot: '/site' }),
    version: 'test',
  })
}

describe('route resolution', () => {
  it('writes resolved page data back without changing route identity', async () => {
    const route = contentRoute({
      path: '/guide',
      filePath: '/site/source/guide.mdx',
      frontmatter: { title: 'Guide' },
      content: 'before',
      pageVirtualModuleId: 'virtual:clarify-page/guide',
      contentVirtualModuleId: 'virtual:clarify-content/guide.mdx',
    })
    const plugins: ClarifyPlugin[] = [{
      name: 'page-transform',
      hooks: {
        'pages:resolved': pages => pages.map(page => ({
          ...page,
          frontmatter: { ...page.frontmatter, title: 'Resolved' },
          content: 'after',
        })),
      },
    }]

    const [resolved] = await resolveRoutePages([route], plugins, createContext())

    expect(resolved).not.toBe(route)
    expect(resolved?.path).toBe('/guide')
    expect(resolved?.module).toBe(route.module)
    expect(resolved?.source).toMatchObject({
      filePath: '/site/source/guide.mdx',
      frontmatter: { title: 'Resolved' },
      content: 'after',
    })
  })

  it('writes page hook results back to the matching route when paths conflict', async () => {
    const routes = [
      contentRoute({ path: '/api', filePath: '/site/source/api.md', content: 'markdown' }),
      contentRoute({ path: '/api', kind: 'openapi', filePath: '/site/source/api.openapi.json', content: 'openapi' }),
    ]
    const plugins: ClarifyPlugin[] = [{
      name: 'page-transform',
      hooks: {
        'pages:resolved': pages => pages.map(page => ({
          ...page,
          content: `${page.content}:resolved`,
        })),
      },
    }]

    const resolved = await resolveRoutePages(routes, plugins, createContext())

    expect(resolved.map(route => route.source.content)).toEqual([
      'markdown:resolved',
      'openapi:resolved',
    ])
  })

  it('checks conflicts after routes:resolved hooks in production', async () => {
    const route = contentRoute({ path: '/guide', pageVirtualModuleId: 'virtual:clarify-page/guide' })
    const plugins: ClarifyPlugin[] = [{
      name: 'duplicate-route',
      hooks: {
        'routes:resolved': input => ({ ...input, routes: [...input.routes, { ...route }] }),
      },
    }]

    await expect(resolveRouteState([route], plugins, createContext(), false))
      .rejects.toThrow('Route conflicts prevent the site from being built')
  })

  it('rebuilds navigation from diagnostic routes after dev conflicts', async () => {
    const routes = [
      contentRoute({ path: '/api', title: 'Markdown API', pageVirtualModuleId: 'virtual:clarify-page/api' }),
      contentRoute({ path: '/api', kind: 'openapi', title: 'OpenAPI', pageVirtualModuleId: 'virtual:clarify-page/api' }),
      contentRoute({ path: '/guide', title: 'Guide', pageVirtualModuleId: 'virtual:clarify-page/guide' }),
    ]

    const resolved = await resolveRouteState(routes, [], createContext(), true)

    expect(resolved.routes).toHaveLength(2)
    expect(resolved.routes.find(route => route.path === '/api')).toMatchObject({
      diagnostic: { title: 'Route conflict' },
      module: { pageVirtualModuleId: 'virtual:clarify-page/api__conflict' },
    })
    expect(resolved.navigation).toEqual({
      kind: 'flat',
      nodes: [
        { path: '/api', title: 'Markdown API', children: [] },
        { path: '/guide', title: 'Guide', children: [] },
      ],
    })
  })
})
