import { renderToReadableStream, renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { ConfigContext, LocaleContext, OpenApisContext } from '../../core'
import { schemaToType } from '../lib/helpers'
import type { OpenAPIOperation, OpenAPISpec } from '../lib/utils'

import { EndpointPath } from './OpenApiOperation'
import { ParameterList, ResponseList, SchemaProperties } from './SchemaProperties'

async function renderOpenApiMarkup(node: React.ReactNode): Promise<string> {
  const stream = await renderToReadableStream(
    <ConfigContext.Provider value={{ routePrefix: '', theme: {}, i18n: undefined } as never}>
      <LocaleContext.Provider value={undefined}>
        <OpenApisContext.Provider value={{}}>
          <MemoryRouter>
            {node}
          </MemoryRouter>
        </OpenApisContext.Provider>
      </LocaleContext.Provider>
    </ConfigContext.Provider>
  )
  await stream.allReady
  return new Response(stream).text()
}

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
  it('keeps enum branches collapsed by default even when x-enumDescriptions are present', async () => {
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
          enum: ['draft', 'published'],
          'x-enumDescriptions': ['Draft content', 'Published content'],
        },
      },
    }

    const markup = await renderOpenApiMarkup(<SchemaProperties title="Body properties" schema={schema} spec={spec} />)

    expect(markup).toContain('status')
    expect(markup).toContain('aria-expanded="false"')
    expect(markup).not.toContain('Draft content')
    expect(markup).not.toContain('Published content')
  })

  it('renders enum value descriptions from object-form x-enumDescriptions when present', async () => {
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
          enum: ['draft', 'published'],
          'x-enumDescriptions': {
            draft: 'Draft content',
            published: 'Published content',
          },
        },
      },
    }

    const markup = await renderOpenApiMarkup(<SchemaProperties title="Body properties" schema={schema} spec={spec} defaultExpanded={true} />)

    expect(markup).toContain('Draft content')
    expect(markup).toContain('Published content')
  })

  it('renders enum values as collapsible child entries instead of inline values', async () => {
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

    const markup = await renderOpenApiMarkup(<SchemaProperties title="Body properties" schema={schema} spec={spec} />)

    expect(markup).toContain('status')
    expect(markup).toContain('aria-expanded="false"')
    expect(markup).not.toContain('active')
    expect(markup).not.toContain('archived')
    expect(markup).not.toContain('enum: active, archived')
    expect(markup).not.toContain('Optional.')
  })

  it('collapses enum branches by default', async () => {
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

    const markup = await renderOpenApiMarkup(<SchemaProperties title="Body properties" schema={schema} spec={spec} />)

    expect(markup).toContain('aria-expanded="false"')
  })
})

describe('ResponseList', () => {
  it('renders response body properties from the declared schema', async () => {
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

    const markup = await renderOpenApiMarkup(<ResponseList operation={operation} spec={spec} />)

    expect(markup).toContain('id')
    expect(markup).toContain('name')
    expect(markup).toContain('Response body properties')
  })

  it('places default first and sorts the remaining response statuses ascending', async () => {
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

    const markup = await renderOpenApiMarkup(<ResponseList operation={operation} spec={spec} />)

    expect(markup.indexOf('default')).toBeLessThan(markup.indexOf('200'))
    expect(markup.indexOf('200')).toBeLessThan(markup.indexOf('400'))
  })
})
