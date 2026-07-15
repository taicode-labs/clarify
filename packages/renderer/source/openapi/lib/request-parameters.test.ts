import { describe, expect, it } from 'vitest'

import { validateRequestParameters } from './request-parameters'
import type { OpenAPISpec } from './utils'

const spec: OpenAPISpec = {
  openapi: '3.1.0',
  info: { title: 'Test', version: '1.0.0' },
  paths: {},
  components: {
    schemas: {
      Tags: { type: 'array', items: { type: 'string' } },
    },
  },
}

describe('validateRequestParameters', () => {
  it('validates required and structured parameter values', () => {
    const parameters = [
      { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      { name: 'tags', in: 'query', schema: { $ref: '#/components/schemas/Tags' } },
      { name: 'filter', in: 'query', schema: { type: 'object' } },
    ]

    expect(validateRequestParameters(spec, parameters, {
      'path:id': '',
      'query:tags': '{}',
      'query:filter': '[]',
    })).toEqual({
      'path:id': 'required',
      'query:tags': 'invalidArray',
      'query:filter': 'invalidObject',
    })
  })

  it('validates scalar formats and enum membership', () => {
    const parameters = [
      { name: 'limit', in: 'query', schema: { type: 'integer' } },
      { name: 'score', in: 'query', schema: { type: 'number' } },
      { name: 'day', in: 'query', schema: { type: 'string', format: 'date' } },
      { name: 'at', in: 'query', schema: { type: 'string', format: 'date-time' } },
      { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'published'] } },
    ]

    expect(validateRequestParameters(spec, parameters, {
      'query:limit': '1.5',
      'query:score': 'NaN',
      'query:day': '14/07/2026',
      'query:at': 'not-a-date',
      'query:status': 'archived',
    })).toEqual({
      'query:limit': 'invalidInteger',
      'query:score': 'invalidNumber',
      'query:day': 'invalidDate',
      'query:at': 'invalidDateTime',
      'query:status': 'invalidEnum',
    })
  })

  it('accepts valid values and ignores empty optional parameters', () => {
    const parameters = [
      { name: 'tags', in: 'query', schema: { type: 'array' } },
      { name: 'filter', in: 'query', schema: { type: 'object' } },
      { name: 'limit', in: 'query', schema: { type: 'integer' } },
      { name: 'at', in: 'query', schema: { type: 'string', format: 'date-time' } },
      { name: 'empty', in: 'query', schema: { type: 'string' } },
    ]

    expect(validateRequestParameters(spec, parameters, {
      'query:tags': '["docs"]',
      'query:filter': '{"active":true}',
      'query:limit': '2',
      'query:at': '2026-07-14T12:00:00Z',
      'query:empty': '',
    })).toEqual({})
  })
})
