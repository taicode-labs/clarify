import { describe, expect, it } from 'vitest'

import type { ContentDiagnostic as RendererDiagnostic } from '@clarify-labs/renderer'

import type { ContentDiagnostic as CliDiagnostic, OpenAPISpec } from '../../types.js'

import { generateOpenAPIErrorModule, generateOpenAPIPageModule, generateOpenAPIRegistryModule, generateOpenAPIServerRegistryModule, generateOpenAPISpecModule, openApiRegistryModuleId, openApiServerRegistryModuleId, specVirtualModuleId } from './virtual-modules.js'

const spec: OpenAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'Example API',
    version: '1.0.0',
  },
  paths: {
    '/users': {
      get: {
        summary: 'List users',
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
  },
}

describe('openapi virtual modules', () => {
  it('uses the shared Clarify runtime virtual module id', () => {
    expect(openApiRegistryModuleId).toBe('virtual:clarify/openapi')
    expect(openApiServerRegistryModuleId).toBe('virtual:clarify/openapi/server')
  })

  it('generates the lazy OpenAPI registry module', () => {
    const code = generateOpenAPIRegistryModule({ 'virtual:clarify-page/api': 'virtual:clarify/openapi-spec/api' })
    expect(code).toContain('export const openApis =')
    expect(code).toContain("() => import(\"virtual:clarify/openapi-spec/api\")")
    expect(code).not.toContain('Example API')
  })

  it('generates the synchronous OpenAPI server registry module', () => {
    const code = generateOpenAPIServerRegistryModule({ 'virtual:clarify-page/api': spec })
    expect(code).toContain('export const openApis =')
    expect(code).toContain('Example API')
  })

  it('generates an OpenAPI route component module', () => {
    const code = generateOpenAPIPageModule({ spec, tagFilter: ['Users'] })
    expect(code).toContain("import { createOpenApiRouteComponent } from '@clarify-labs/renderer';")
    expect(code).toContain('routeData')
    expect(code).toContain('"Example API"')
    expect(code).toContain('"Users"')
  })

  it('generates an OpenAPI route component module without tag filter', () => {
    const code = generateOpenAPIPageModule({ spec })
    expect(code).toContain("import { createOpenApiRouteComponent } from '@clarify-labs/renderer';")
    expect(code).toContain('routeData')
    expect(code).toContain('"Example API"')
  })

  it('shares the same diagnostic intent across CLI and renderer', () => {
    const cliDiagnostic: CliDiagnostic = {
      kind: 'mdx',
      title: 'CLI diagnostic',
      message: 'Something failed',
      filePath: '/docs/example.md',
      details: 'Root cause',
    }
    const rendererDiagnostic: RendererDiagnostic = {
      kind: cliDiagnostic.kind,
      title: cliDiagnostic.title,
      message: cliDiagnostic.message,
      filePath: cliDiagnostic.filePath,
      details: cliDiagnostic.details,
    }

    expect(cliDiagnostic.title).toBe(rendererDiagnostic.title)
    expect(cliDiagnostic.message).toBe(rendererDiagnostic.message)
    expect(rendererDiagnostic.details).toBe(cliDiagnostic.details)
  })

  it('generates a per-spec virtual module', () => {
    const code = generateOpenAPISpecModule(spec)
    expect(code).toContain('export default')
    expect(code).toContain('"Example API"')
  })

  it('derives spec virtual module IDs from spec keys', () => {
    expect(specVirtualModuleId('api')).toBe('virtual:clarify/openapi-spec/api')
    expect(specVirtualModuleId('some_nested_key')).toBe('virtual:clarify/openapi-spec/some_nested_key')
  })

  it('generates an OpenAPI diagnostic route component module', () => {
    const code = generateOpenAPIErrorModule({
      kind: 'openapi',
      title: 'OpenAPI spec parse failed',
      message: 'Clarify could not parse api.openapi.yaml.',
      filePath: '/docs/api.openapi.yaml',
      details: 'YAMLException: bad indentation',
    })
    expect(code).toContain('contentDiagnostic')
    expect(code).toContain('OpenAPI spec parse failed')
    expect(code).toContain('bad indentation')
    expect(code).not.toContain('createElement')
  })
})
