import { describe, expect, it } from 'vitest'

import type { ContentRoute } from '../../types.js'

import { attachSourceUrls, createSourceUrl } from './source-links.js'

describe('source links', () => {
  it('creates GitHub edit links from content file paths', () => {
    expect(createSourceUrl('/repo/apps/docs/source/en-US/index.mdx', '/repo/apps/docs/source', {
      repository: 'https://github.com/taicode-labs/clarify.git',
      branch: 'main',
      directory: 'apps/docs/source',
    })).toBe('https://github.com/taicode-labs/clarify/edit/main/apps/docs/source/en-US/index.mdx')
  })

  it('attaches sourceUrl to routes', () => {
    const routes: ContentRoute[] = [
      {
        path: '/',
        title: 'Home',
        filePath: '/repo/source/index.mdx',
        virtualModuleId: '/repo/source/index.mdx',
        kind: 'mdx',
      },
    ]

    attachSourceUrls(routes, '/repo/source', { repository: 'https://github.com/acme/docs' })

    expect(routes[0]?.artifact?.sourceUrl).toBe('https://github.com/acme/docs/edit/main/index.mdx')
  })
})
