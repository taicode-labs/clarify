import { describe, expect, it } from 'vitest'

import * as renderer from './index'

describe('renderer root entrypoint', () => {
  it('exposes only the unified renderer-owned route and runtime APIs', () => {
    expect(renderer).toHaveProperty('createContentDiagnosticComponent')
    expect(renderer).toHaveProperty('createDocumentRouteComponent')
    expect(renderer).toHaveProperty('createOpenApiRouteComponent')
    expect(renderer).toHaveProperty('render')
    expect(renderer).toHaveProperty('themePresets')
    expect(renderer).toHaveProperty('themeBootstrapScript')
    expect(renderer).toHaveProperty('useSlot')
    expect(renderer).toHaveProperty('useMDXComponents')

    expect(renderer).not.toHaveProperty('AppShell')
    expect(renderer).not.toHaveProperty('OpenApiDocument')
    expect(renderer).not.toHaveProperty('OpenApiOperation')
    expect(renderer).not.toHaveProperty('Markdown')
    expect(renderer).not.toHaveProperty('compileMdxContent')
    expect(renderer).not.toHaveProperty('createMdxRollupPlugin')
    expect(renderer).not.toHaveProperty('rehypePlugins')
    expect(renderer).not.toHaveProperty('remarkPlugins')
  })
})
