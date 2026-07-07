import { describe, expect, it } from 'vitest'

import { resolveThemeConfig } from '../../core/theme.js'
import type { ContentRoute, ResolvedProjectConfig } from '../../types.js'

import { resolveContentArtifactPath, resolveContentArtifactType } from './server.js'

const projectConfig: ResolvedProjectConfig = {
  title: 'Clarify',
  description: '',
  routePrefix: '/',
  assetPrefix: '/',
  theme: resolveThemeConfig(),
  variables: {},
}

function createRoute(kind: 'mdx' | 'openapi', contentArtifactUrl: string): ContentRoute {
  return {
    path: '/api',
    title: 'API',
    filePath: '/tmp/api.openapi.yaml',
    virtualModuleId: 'virtual:clarify-page/api',
    kind,
    artifact: { contentArtifactUrl },
  }
}

describe('content artifacts plugin server helpers', () => {
  it('resolves paths without a route prefix', () => {
    expect(resolveContentArtifactPath('/guide.md?raw=1', projectConfig)).toBe('/guide.md')
  })

  it('strips configured route prefix from artifact paths', () => {
    expect(resolveContentArtifactPath('/docs/guide.md', { ...projectConfig, routePrefix: '/docs' })).toBe('/guide.md')
  })

  it('uses markdown content type for mdx routes', () => {
    expect(resolveContentArtifactType(createRoute('mdx', '/guide.md'))).toBe('text/markdown; charset=utf-8')
  })

  it('uses json content type for OpenAPI routes', () => {
    expect(resolveContentArtifactType(createRoute('openapi', '/api.openapi.json'))).toBe('application/json; charset=utf-8')
  })
})
