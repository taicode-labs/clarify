import { describe, expect, it } from 'vitest'

import type { OpenAPISpec } from '../lib/utils'

import { getAuthOptions } from './helpers'

describe('getAuthOptions', () => {
  it('preserves OR requirements and AND schemes', () => {
    const bearerAuth = { type: 'http', scheme: 'bearer' } as const
    const apiKey = { type: 'apiKey', in: 'query', name: 'api_key' } as const
    const basicAuth = { type: 'http', scheme: 'basic' } as const
    const spec: OpenAPISpec = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: {
        securitySchemes: {
          bearerAuth,
          apiKey,
          basicAuth,
        },
      },
      security: [{ bearerAuth: [], apiKey: [] }, { basicAuth: [] }],
    }

    expect(getAuthOptions(spec, {})).toEqual([
      {
        key: 'requirement:0',
        label: 'bearerAuth + apiKey',
        schemes: [
          { name: 'bearerAuth', scheme: bearerAuth, scopes: [] },
          { name: 'apiKey', scheme: apiKey, scopes: [] },
        ],
      },
      {
        key: 'requirement:1',
        label: 'basicAuth',
        schemes: [{ name: 'basicAuth', scheme: basicAuth, scopes: [] }],
      },
    ])
  })

  it('keeps an empty requirement as an anonymous no-auth option', () => {
    const spec: OpenAPISpec = { openapi: '3.1.0', info: { title: 'Test', version: '1.0.0' }, paths: {}, security: [{}] }
    expect(getAuthOptions(spec, {})).toEqual([{ key: 'requirement:0', label: '', schemes: [] }])
  })
})
