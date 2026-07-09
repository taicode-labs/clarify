import { describe, expect, it } from 'vitest'

import { resolveThemeConfig } from '../../core/site/theme.js'
import type { ClarifyHookContext } from '../../types.js'

import { createVariablesPlugin } from './index.js'

const ctx: ClarifyHookContext = {
  projectRoot: '/site',
  contentRoot: '/site/source',
  projectConfig: {
    title: 'Docs',
    description: '',
    routePrefix: '/',
    assetPrefix: '/',
    theme: resolveThemeConfig(),
    variables: {
      product: {
        name: 'Clarify',
        tagline: 'Docs that stay in sync',
      },
      release: 'Release Notes',
    },
  },
  generateOptions: {
    projectRoot: '/site',
    rootDirectory: 'source',
    outputDirectory: 'output',
    ssg: { failOnError: true },
  },
  version: 'test',
  routes: [],
  navigation: [],
  plugins: [],
}

describe('createVariablesPlugin', () => {
  it('expands project variables in MDX content and route frontmatter fields', async () => {
    const plugin = createVariablesPlugin()
    const result = await plugin.hooks?.['content:transform']?.({
      kind: 'mdx',
      source: '# {{ product.name }}',
      filePath: '/site/source/page.mdx',
      frontmatter: {
        title: '{{ product.name }}',
        description: '{{ product.tagline }}',
        badge: '{{ release }}',
      },
      content: '# {{ product.name }}\n\n## {{ release }}',
    }, ctx)

    expect(result?.frontmatter).toEqual({
      title: 'Clarify',
      description: 'Docs that stay in sync',
      badge: '{{ release }}',
    })
    expect(result?.content).toBe('# Clarify\n\n## Release Notes')
  })

  it('expands project variables in OpenAPI text content', async () => {
    const plugin = createVariablesPlugin()
    const result = await plugin.hooks?.['content:transform']?.({
      kind: 'openapi',
      source: '{"info":{"title":"{{ product.name }} API"}}',
      filePath: '/site/source/api.openapi.json',
      frontmatter: {},
      content: '{"info":{"title":"{{ product.name }} API"}}',
    }, ctx)

    expect(result?.content).toBe('{"info":{"title":"Clarify API"}}')
  })
})
