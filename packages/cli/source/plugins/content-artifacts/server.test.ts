import { describe, expect, it } from 'vitest'

import { resolveThemeConfig } from '../../core/theme.js'
import type { ContentRoute, ResolvedProjectConfig } from '../../types.js'

import { resolveContentArtifactPath, resolveContentArtifactType } from './server.js'

const projectConfig: ResolvedProjectConfig = {
  title: 'Clarify',
  description: '',
  routePrefix: '/',
  theme: resolveThemeConfig(),
  themeEditor: false,
}

function createRoute(kind: ContentRoute['kind'], contentArtifactUrl: string): ContentRoute {
  return {
    path: '/api',
    title: 'API',
    filePath: '/tmp/api.openapi.yaml',
    virtualModuleId: 'virtual:clarify-page/api',
    kind,
    contentArtifactUrl,
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

  it('uses yaml content type for yaml OpenAPI routes', () => {
    expect(resolveContentArtifactType(createRoute('openapi', '/api.openapi.yaml'))).toBe('text/yaml; charset=utf-8')
  })

  it('uses json content type for JSON OpenAPI routes', () => {
    expect(resolveContentArtifactType(createRoute('openapi', '/api.openapi.json'))).toBe('application/json; charset=utf-8')
  })
})
