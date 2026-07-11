import { describe, expect, it } from 'vitest'

import type { ContentRoute } from '../../types.js'

import { attachSourceEditUrls, createSourceEditUrl } from './source-links.js'

describe('source links', () => {
  it('creates GitHub edit links from content file paths', () => {
    expect(createSourceEditUrl('/repo/apps/docs/source/en-US/index.mdx', '/repo/apps/docs/source', {
      repository: 'https://github.com/taicode-labs/clarify.git',
      branch: 'main',
      directory: 'apps/docs/source',
    })).toBe('https://github.com/taicode-labs/clarify/edit/main/apps/docs/source/en-US/index.mdx')
  })

  it('attaches source edit URLs to routes', () => {
    const routes: ContentRoute[] = [
      {
        path: '/',
        kind: 'mdx',
        meta: { title: 'Home' },
        module: { virtualModuleId: '/repo/source/index.mdx' },
        source: { filePath: '/repo/source/index.mdx' },
      },
    ]

    attachSourceEditUrls(routes, '/repo/source', { repository: 'https://github.com/acme/docs' })

    expect(routes[0]?.source?.sourceEditUrl).toBe('https://github.com/acme/docs/edit/main/index.mdx')
  })
})
