import { describe, expect, it } from 'vitest'

import type { OpenAPISpec } from '../../types.js'

import { extractOpenAPISections } from './parser.js'

describe('extractOpenAPISections', () => {
  it('orders configured operation IDs first and appends remaining operations stably', () => {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: { title: 'Assets', version: '1.0.0' },
      paths: {
        '/assets': {
          get: { operationId: 'listAssets', summary: 'List assets', responses: {} },
          post: { operationId: 'createAsset', summary: 'Create asset', responses: {} },
        },
        '/assets/{id}': {
          get: { operationId: 'getAsset', summary: 'Get asset', responses: {} },
          delete: { operationId: 'deleteAsset', summary: 'Delete asset', responses: {} },
        },
      },
    }

    const sections = extractOpenAPISections(spec, undefined, ['createAsset', 'getAsset'])

    expect(sections.map(section => section.id)).toEqual([
      'createAsset',
      'getAsset',
      'listAssets',
      'deleteAsset',
    ])
  })
})
