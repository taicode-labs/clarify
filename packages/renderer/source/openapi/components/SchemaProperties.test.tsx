import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { schemaToType } from '../lib/helpers'
import type { OpenAPIOperation, OpenAPISpec } from '../lib/utils'


import { EndpointPath } from './OpenApiOperation'
import { ParameterList, ResponseList, SchemaProperties } from './SchemaProperties'

describe('ParameterList', () => {
  it('renders a normalized empty state when there are no parameters', () => {
    const markup = renderToStaticMarkup(<ParameterList title="Query parameters" parameters={[]} />)

    expect(markup).toContain('Query parameters')
    expect(markup).toContain('None')
  })
})

describe('EndpointPath', () => {
  it('renders only the endpoint path while keeping the full URL available for copy', () => {
    const markup = renderToStaticMarkup(<EndpointPath path="/pets/{id}" />)

    expect(markup).toContain('/pets/{id}')
    expect(markup).not.toContain('https://api.example.com')
  })
})

describe('schemaToType', () => {
  it('returns enum for enum schemas', () => {
    expect(schemaToType({ type: 'string', enum: ['draft', 'published'] })).toBe('enum')
  })

  it('returns a referenced schema name for $ref schemas', () => {
    expect(schemaToType({ $ref: '#/components/schemas/PageStatus' })).toBe('PageStatus')
  })

  it('returns the const value string for const schemas', () => {
    expect(schemaToType({ const: 'published' })).toBe('"published"')
  })

  it('renders arrays with the item type', () => {
    expect(schemaToType({ type: 'array', items: { type: 'string' } })).toBe('string[]')
  })

  it('supports nullable type unions', () => {
    expect(schemaToType({ type: ['string', 'null'] })).toBe('string | null')
  })

  it('supports referenced items inside arrays', () => {
    expect(schemaToType({ type: 'array', items: { $ref: '#/components/schemas/PageStatus' } })).toBe('PageStatus[]')
  })

  it('combines oneOf branches with a pipe', () => {
    expect(schemaToType({ oneOf: [{ type: 'string' }, { type: 'number' }] })).toBe('string | number')
  })

  it('supports anyOf branches like oneOf', () => {
    expect(schemaToType({ anyOf: [{ type: 'string' }, { type: 'integer' }] })).toBe('string | integer')
  })

  it('combines allOf branches with an ampersand', () => {
    expect(schemaToType({ allOf: [{ type: 'string' }, { type: 'number' }] })).toBe('string & number')
  })

  it('includes format for scalar types', () => {
    expect(schemaToType({ type: 'string', format: 'date-time' })).toBe('string<date-time>')
  })

  it('supports nested compositions with formats', () => {
    expect(schemaToType({ oneOf: [{ type: 'string', format: 'email' }, { type: 'null' }] })).toBe('string<email> | null')
  })

  it('returns the base type for plain object schemas', () => {
    expect(schemaToType({ type: 'object' })).toBe('object')
  })

  it('returns undefined for schemas without a recognizable shape', () => {
    expect(schemaToType({ description: 'opaque schema' })).toBeUndefined()
  })
})

describe('SchemaProperties', () => {
  it('renders enum values as expandable child entries instead of inline values', () => {
    const spec: OpenAPISpec = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
    }

    const schema = {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'archived'],
        },
      },
    }

    const markup = renderToStaticMarkup(<SchemaProperties title="Body properties" schema={schema} spec={spec} />)

    expect(markup).toContain('status')
    expect(markup).toContain('active')
    expect(markup).toContain('archived')
    expect(markup).toContain('aria-expanded')
    expect(markup).not.toContain('enum: active, archived')
  })
})

describe('ResponseList', () => {
  it('renders response body properties from the declared schema', () => {
    const spec: OpenAPISpec = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
    }

    const operation: OpenAPIOperation = {
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
      },
    }

    const markup = renderToStaticMarkup(<ResponseList operation={operation} spec={spec} />)

    expect(markup).toContain('id')
    expect(markup).toContain('name')
    expect(markup).toContain('Response body properties')
  })

  it('places default first and sorts the remaining response statuses ascending', () => {
    const spec: OpenAPISpec = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
    }

    const operation: OpenAPIOperation = {
      responses: {
        '400': { description: 'Bad request' },
        default: { description: 'Fallback' },
        '200': { description: 'Ok' },
      },
    }

    const markup = renderToStaticMarkup(<ResponseList operation={operation} spec={spec} />)

    expect(markup.indexOf('default')).toBeLessThan(markup.indexOf('200'))
    expect(markup.indexOf('200')).toBeLessThan(markup.indexOf('400'))
  })
})
