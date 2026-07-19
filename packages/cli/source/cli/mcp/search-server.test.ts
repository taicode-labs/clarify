import { describe, expect, it, vi } from 'vitest'

import type { McpSiteConfig } from '../../plugins/mcp-search/mcp-config.js'

import type { LoadedSearchIndex, SearchResult } from './orama-loader.js'
import type { LoadedMcpSite } from './search-server.js'
import { createMcpSearchServer } from './search-server.js'

function makeConfig(overrides: Partial<McpSiteConfig> = {}): McpSiteConfig {
  return {
    version: 3,
    site: { title: 'Test Docs', routePrefix: '/' },
    capabilities: {
      search: {
        type: 'search',
        indexPath: '/mcp-search.msp',
        defaultLocale: 'zh-cn',
        documentCount: 49,
        locales: ['zh-cn', 'en-us'],
      },
    },
    ...overrides,
  }
}

function makeIndex(result: Partial<SearchResult> = {}): LoadedSearchIndex {
  return {
    search: vi.fn(() => ({
      hits: [],
      count: 0,
      ...result,
    })),
    dispose: vi.fn(() => {}),
  }
}

function makeSite(overrides: Partial<LoadedMcpSite> = {}): LoadedMcpSite {
  return {
    siteUrl: 'https://docs.example.com',
    config: makeConfig(),
    index: makeIndex(),
    ...overrides,
  }
}

/** Access the registered tool handler via the SDK's internal tool map. */
function getToolHandler(server: ReturnType<typeof createMcpSearchServer>): (args: Record<string, unknown>) => Promise<unknown> {
  const registered = (server as unknown as {
    _registeredTools: Record<string, { handler: (args: Record<string, unknown>) => Promise<unknown> }>
  })._registeredTools
  expect('search_docs' in registered).toBe(true)
  return registered['search_docs']!.handler
}

describe('createMcpSearchServer', () => {
  it('registers a search_docs tool', () => {
    const server = createMcpSearchServer([makeSite()], { log: () => {} })
    expect(server).toBeDefined()
    expect(server.server).toBeDefined()
  })

  it('returns serialized search results from the search_docs tool callback', async () => {
    const index = makeIndex({
      hits: [
        {
          path: '/getting-started/',
          title: 'Getting Started',
          description: 'Intro guide',
          locale: 'zh-cn',
          score: 12.5,
          excerpt: 'Use Clarify to build docs',
          keywords: ['intro'],
        },
      ],
      count: 1,
    })

    const server = createMcpSearchServer([makeSite({ index })], { log: () => {} })
    const handler = getToolHandler(server)
    const result = (await handler({ query: 'clarify' })) as {
      content: Array<{ type: string; text: string }>
    }

    expect(result.content).toHaveLength(1)
    expect(result.content[0].type).toBe('text')
    const text = result.content[0].text
    expect(text).toContain('Getting Started')
    expect(text).toContain('/getting-started/')
    expect(text).toContain('Found 1 result')
    expect(text).toContain('Site: https://docs.example.com')
    expect(index.search).toHaveBeenCalledWith({ query: 'clarify', locale: undefined, limit: undefined })
  })

  it('passes the locale filter through to the index', async () => {
    const index = makeIndex()
    const server = createMcpSearchServer([makeSite({ index })], { log: () => {} })
    const handler = getToolHandler(server)

    await handler({ query: 'hello', locale: 'en-us' })

    expect(index.search).toHaveBeenCalledWith({ query: 'hello', locale: 'en-us', limit: undefined })
  })

  it('passes the limit argument through to the index', async () => {
    const index = makeIndex({
      hits: Array.from({ length: 3 }, (_, i) => ({
        path: `/page-${i}/`,
        title: `Page ${i}`,
        description: '',
        locale: 'en-us',
        score: 10 - i,
        excerpt: `result ${i}`,
        keywords: [],
      })),
      count: 3,
    })
    const server = createMcpSearchServer([makeSite({ index })], { log: () => {} })
    const handler = getToolHandler(server)
    const result = (await handler({ query: 'x', limit: 3 })) as {
      content: Array<{ type: string; text: string }>
    }

    expect(index.search).toHaveBeenCalledWith({ query: 'x', locale: undefined, limit: 3 })
    // Summary + 3 result sections, separated by '---'.
    const sections = result.content[0].text.split('\n---\n')
    expect(sections).toHaveLength(4)
  })

  it('returns an error result when every index.search throws', async () => {
    const index: LoadedSearchIndex = {
      search: vi.fn(() => {
        throw new Error('index corrupted')
      }),
      dispose: vi.fn(() => {}),
    }
    const server = createMcpSearchServer([makeSite({ index })], { log: () => {} })
    const handler = getToolHandler(server)
    const result = (await handler({ query: 'broken' })) as {
      isError?: boolean
      content: Array<{ type: string; text: string }>
    }

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('index corrupted')
  })

  it('includes locale and keywords in the formatted output', async () => {
    const index = makeIndex({
      hits: [
        {
          path: '/zh-CN/api',
          title: 'API 文档',
          description: '完整 API 参考',
          locale: 'zh-cn',
          score: 5,
          excerpt: 'API 接口说明',
          keywords: ['api', '参考'],
        },
      ],
      count: 1,
    })
    const server = createMcpSearchServer([makeSite({ index })], { log: () => {} })
    const handler = getToolHandler(server)
    const result = (await handler({ query: 'api' })) as {
      content: Array<{ type: string; text: string }>
    }

    const text = result.content[0].text
    expect(text).toContain('Locale: zh-cn')
    expect(text).toContain('Keywords: api, 参考')
    expect(text).toContain('Description: 完整 API 参考')
  })

  it('mentions document count and locale count in the tool description', () => {
    const server = createMcpSearchServer([makeSite()], { log: () => {} })
    const registered = (server as unknown as {
      _registeredTools: Record<string, { description: string }>
    })._registeredTools
    const desc = registered['search_docs']!.description
    expect(desc).toContain('49 pages')
    expect(desc).toContain('2 locale')
    expect(desc).toContain('zh-cn')
    expect(desc).toContain('en-us')
  })

  it('merges results across multiple sites and annotates each hit with its source', async () => {
    const siteA = makeSite({
      siteUrl: 'https://a.example.com',
      config: makeConfig({ site: { title: 'Site A', routePrefix: '/' } }),
      index: makeIndex({
        hits: [
          {
            path: '/a/guide/',
            title: 'Guide A',
            description: '',
            locale: 'en-us',
            score: 5,
            excerpt: 'a guide',
            keywords: [],
          },
        ],
        count: 1,
      }),
    })
    const siteB = makeSite({
      siteUrl: 'https://b.example.com',
      config: makeConfig({ site: { title: 'Site B', routePrefix: '/' } }),
      index: makeIndex({
        hits: [
          {
            path: '/b/guide/',
            title: 'Guide B',
            description: '',
            locale: 'en-us',
            score: 10,
            excerpt: 'b guide',
            keywords: [],
          },
        ],
        count: 1,
      }),
    })

    const server = createMcpSearchServer([siteA, siteB], { log: () => {} })
    const handler = getToolHandler(server)
    const result = (await handler({ query: 'guide' })) as {
      content: Array<{ type: string; text: string }>
    }

    const text = result.content[0].text
    expect(text).toContain('2 site(s)')
    // Higher-scoring hit (Guide B, score 10) should be ranked first.
    const sections = text.split('\n---\n')
    expect(sections).toHaveLength(3) // summary + 2 hits
    expect(sections[1]).toContain('Guide B')
    expect(sections[1]).toContain('Site: https://b.example.com')
    expect(sections[2]).toContain('Guide A')
    expect(sections[2]).toContain('Site: https://a.example.com')
    // Both indices were searched.
    expect(siteA.index.search).toHaveBeenCalled()
    expect(siteB.index.search).toHaveBeenCalled()
  })
})
