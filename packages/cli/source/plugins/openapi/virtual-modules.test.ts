import { describe, expect, it } from 'vitest'

import type { OpenAPISpec } from '../../types.js'

import { generateOpenAPIModule, generateOpenAPIRegistryModule, openApiRegistryModuleId } from './virtual-modules.js'

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
  it('keeps the public registry virtual module id stable', () => {
    expect(openApiRegistryModuleId).toBe('virtual:clarify-openapi-registry')
  })

  it('generates the OpenAPI registry module', () => {
    const code = generateOpenAPIRegistryModule({ 'virtual:clarify-page/api': spec })
    expect(code).toContain('export const openApis =')
    expect(code).toContain('Example API')
  })

  it('generates an OpenAPI route component module', () => {
    const code = generateOpenAPIModule(spec)
    expect(code).toContain("import { OpenApiPage } from '@clarify-labs/renderer';")
    expect(code).toContain('function OpenApiRoutePage')
    expect(code).toContain('Example API')
  })
})
