import { describe, expect, it } from 'vitest'

import { compileRouteModule } from './index'

describe('compileRouteModule', () => {
  it('compiles a document payload into a browser-safe route module', async () => {
    const result = await compileRouteModule({
      route: {
        path: '/guide',
        filePath: '/site/source/guide.mdx',
      },
      payload: {
        kind: 'document',
        document: {
          id: '/guide',
          title: 'Guide',
          source: '/site/source/guide.mdx',
          content: [{ kind: 'markdown', value: '## Install\n\n```ts\nconst answer = 42\n```' }],
          metadata: {},
        },
      },
      options: {
        mode: 'production',
        target: 'client',
      },
      projectRoot: '/site',
    })

    expect(result.id).toBe('/guide')
    expect(result.dependencies).toEqual(['/site/source/guide.mdx'])
    expect(result.code).toContain("from '@clarify-labs/renderer/client';")
    expect(result.code).toContain('createComponentRouteComponent')
    expect(result.code).toContain('renderContentDocument')
    expect(result.code).toContain('id: "install"')
    expect(result.code).toContain('highlightedHtml')
  })

  it('throws an mdx diagnostic for invalid input', async () => {
    await expect(compileRouteModule({
      route: {
        path: '/broken',
        filePath: '/site/source/broken.mdx',
      },
      payload: {
        kind: 'document',
        document: {
          id: '/broken',
          title: 'Broken',
          source: '/site/source/broken.mdx',
          content: [{ kind: 'markdown', value: '<Broken' }],
          metadata: {},
        },
      },
      options: {
        mode: 'development',
        target: 'client',
      },
      projectRoot: '/site',
    })).rejects.toMatchObject({
      kind: 'mdx',
      title: 'MDX syntax error',
      filePath: 'source/broken.mdx',
    })
  })
})
