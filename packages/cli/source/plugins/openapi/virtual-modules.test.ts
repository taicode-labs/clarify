import { describe, expect, it } from 'vitest'

import type { OpenAPISpec } from '../../types.js'

import { generateOpenAPIErrorModule, generateOpenAPIPageModule, generateOpenAPIRegistryModule, generateOpenAPISpecModule, openApiRegistryModuleId, specVirtualModuleId } from './virtual-modules.js'

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
  })

  it('generates the OpenAPI registry module', () => {
    const code = generateOpenAPIRegistryModule({ 'virtual:clarify-page/api': spec })
    expect(code).toContain('export const openApis =')
    expect(code).toContain('Example API')
  })

  it('generates an OpenAPI route component module (inline/dev mode)', () => {
    const code = generateOpenAPIPageModule({ mode: 'inline', spec, tagFilter: ['Users'] })
    expect(code).toContain("import { OpenApiDocument } from '@clarify-labs/renderer';")
    expect(code).toContain('function OpenApiRoutePage')
    expect(code).toContain('Example API')
    expect(code).toContain('const tagFilter = ["Users"]')
  })

  it('generates an OpenAPI route component module (lazy/build mode)', () => {
    const code = generateOpenAPIPageModule({ mode: 'lazy', specKey: 'api', tagFilter: ['Users'] })
    expect(code).toContain("import { OpenApiDocument, useOpenApis } from '@clarify-labs/renderer';")
    expect(code).toContain('function OpenApiRoutePage')
    expect(code).toContain('SPEC_KEY = "api"')
    expect(code).toContain('import("virtual:clarify/openapi-spec/api")')
    expect(code).toContain('loadSpec()')
    expect(code).toContain('var TAG_FILTER = ["Users"]')
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
      title: 'OpenAPI spec parse failed',
      message: 'Clarify could not parse api.openapi.yaml.',
      filePath: '/docs/api.openapi.yaml',
      cause: 'YAMLException: bad indentation',
    })
    expect(code).toContain('OpenApiErrorRoutePage')
    expect(code).toContain('OpenAPI spec parse failed')
    expect(code).toContain('Why it happened')
    expect(code).toContain('bad indentation')
  })
})
