import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ConfigContext } from '../../core/context'
import type { Config } from '../../core/types'
import { schemaToType } from '../lib/helpers'
import type { OpenAPIOperation, OpenAPISpec } from '../lib/utils'


import { EndpointRequest } from './EndpointSections'
import { EndpointPath } from './OpenApiOperation'
import { ParameterList, ResponseList, SchemaProperties } from './SchemaProperties'

describe('ParameterList', () => {
  it('renders nothing when there are no parameters', () => {
    const markup = renderToStaticMarkup(<ParameterList title="Query parameters" parameters={[]} />)

    expect(markup).toBe('')
  })
})

describe('EndpointRequest', () => {
  it('renders a friendly empty state when there is no request body', () => {
    const markup = renderToStaticMarkup(
      <EndpointRequest
        spec={{ openapi: '3.1.0', info: { title: 'Test API', version: '1.0.0' }, paths: {} }}
        path="/pets"
        method="get"
        groupedParameters={{ path: [], query: [], header: [] }}
        parameters={[]}
        requestContents={[]}
        requestSchema={undefined}
        selectedRequestMediaType=""
        onSelectRequestMediaType={() => {}}
        selectedServer={{ url: 'https://api.example.com' }}
        serverVariables={{}}
        authOptions={[]}
      />,
    )

    expect(markup).toContain('No request body')
  })

  it('renders authentication requirements in the endpoint documentation', () => {
    const markup = renderToStaticMarkup(
      <EndpointRequest
        spec={{ openapi: '3.1.0', info: { title: 'Test API', version: '1.0.0' }, paths: {} }}
        path="/pets"
        method="get"
        groupedParameters={{ path: [], query: [], header: [] }}
        parameters={[]}
        requestContents={[]}
        requestSchema={undefined}
        selectedRequestMediaType=""
        onSelectRequestMediaType={() => {}}
        selectedServer={{ url: 'https://api.example.com' }}
        serverVariables={{}}
        authOptions={[
          {
            key: 'requirement:0',
            label: 'bearerAuth',
            schemes: [
              {
                name: 'bearerAuth',
                scheme: {
                  type: 'http',
                  scheme: 'bearer',
                },
                scopes: [],
              },
            ],
          },
        ]}
      />,
    )

    expect(markup).toContain('Authentication')
    expect(markup).toContain('bearerAuth')
    expect(markup).toContain('<section class="clarify-openapi-document-section">')
  })

  it('renders authentication alternatives, combinations, and scheme metadata', () => {
    const config = {
      routePrefix: '/',
      assetPrefix: '/',
    } as Config
    const markup = renderToStaticMarkup(
      <ConfigContext.Provider value={config}>
        <EndpointRequest
          spec={{ openapi: '3.1.0', info: { title: 'Test API', version: '1.0.0' }, paths: {} }}
          path="/pets"
          method="get"
          groupedParameters={{ path: [], query: [], header: [] }}
          parameters={[]}
          requestContents={[]}
          requestSchema={undefined}
          selectedRequestMediaType=""
          onSelectRequestMediaType={() => {}}
          selectedServer={{ url: 'https://api.example.com' }}
          serverVariables={{}}
          authOptions={[
            {
              key: 'requirement:0',
              label: 'apiKey + oauth',
              schemes: [
                {
                  name: 'apiKey',
                  scheme: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key',
                    description: 'Send a project key in `X-API-Key`. [Manage keys](https://example.com/keys).',
                  },
                  scopes: [],
                },
                {
                  name: 'oauth',
                  scheme: { type: 'oauth2' },
                  scopes: ['pets:read'],
                },
              ],
            },
            { key: 'requirement:1', label: '', schemes: [] },
          ]}
        />
      </ConfigContext.Provider>,
    )

    expect(markup).toContain('API key')
    expect(markup).toContain('header parameter: X-API-Key')
    expect(markup).toMatch(/<code[^>]*>X-API-Key<\/code>/)
    expect(markup).toMatch(/<a href="https:\/\/example\.com\/keys"[^>]*>Manage keys<\/a>/)
    expect(markup).toContain('Scopes: pets:read')
    expect(markup).toContain('AND')
    expect(markup).toContain('role="tablist"')
    expect(markup).toContain('aria-selected="true"')
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
  it('fuzzy filters nested properties and keeps their parent path visible', () => {
    const spec = { openapi: '3.1.0', info: { title: 'Test API', version: '1.0.0' }, paths: {} }
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        address: {
          type: 'object',
          properties: {
            postalCode: { type: 'string', description: 'Delivery ZIP code' },
            city: { type: 'string' },
          },
        },
      },
    }

    const markup = renderToStaticMarkup(<SchemaProperties title="Body properties" schema={schema} spec={spec} query="pstl" />)

    expect(markup).toContain('address')
    expect(markup).toContain('postalCode')
    expect(markup).toContain('city')
    expect(markup).toContain('aria-expanded="true"')
  })

  it('renders a localized empty state when no properties match', () => {
    const spec = { openapi: '3.1.0', info: { title: 'Test API', version: '1.0.0' }, paths: {} }
    const schema = { type: 'object', properties: { name: { type: 'string' } } }

    const markup = renderToStaticMarkup(<SchemaProperties title="Body properties" schema={schema} spec={spec} query="unmatched" />)

    expect(markup).toContain('name')
    expect(markup).toContain('No request body properties match the current search.')
  })

  it('renders nested properties as an indented tree outside prose styles', () => {
    const spec: OpenAPISpec = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
    }

    const schema = {
      type: 'object',
      properties: {
        profile: {
          type: 'object',
          properties: { name: { type: 'string' } },
        },
      },
    }

    const markup = renderToStaticMarkup(<SchemaProperties title="Body properties" schema={schema} spec={spec} />)

    expect(markup).toContain('<section class="clarify-openapi-document-section"><h4')
    expect(markup).toContain('class="mt-2 clarify-schema-properties not-prose"')
    expect(markup).toContain('clarify-schema-node m-0 p-0')
    expect(markup).toMatch(/<button[^>]*class="[^"]*rounded-\(--clarify-theme-tokens-radius-md\)[^"]*hover:bg-/)
    expect(markup).toContain('ml-2 border-l border-(--clarify-theme-tokens-colors-border) pl-2')
  })

  it('keeps enum branches collapsed by default even when x-enumDescriptions are present', () => {
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

    const markup = renderToStaticMarkup(<SchemaProperties title="Body properties" schema={schema} spec={spec} />)

    expect(markup).toContain('status')
    expect(markup).toContain('aria-expanded="false"')
    expect(markup).toContain('hidden')
    expect(markup).toContain('Draft content')
    expect(markup).toContain('Published content')
  })

  it('renders enum value descriptions from object-form x-enumDescriptions when present', () => {
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

    const markup = renderToStaticMarkup(<SchemaProperties title="Body properties" schema={schema} spec={spec} defaultExpanded={true} />)

    expect(markup).toContain('Draft content')
    expect(markup).toContain('Published content')
  })

  it('renders enum values as collapsible child entries instead of inline values', () => {
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
    expect(markup).toContain('aria-expanded="false"')
    expect(markup).toContain('hidden')
    expect(markup).toContain('active')
    expect(markup).toContain('archived')
  })

  it('collapses enum branches by default', () => {
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

    expect(markup).toContain('aria-expanded="false"')
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

  it('fuzzy filters response body properties and keeps their parent path visible', () => {
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
                  name: { type: 'string' },
                  address: {
                    type: 'object',
                    properties: {
                      postalCode: { type: 'string', description: 'Delivery ZIP code' },
                      city: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const markup = renderToStaticMarkup(<ResponseList operation={operation} spec={spec} query="pstl" />)

    expect(markup).toContain('address')
    expect(markup).toContain('postalCode')
    expect(markup).toContain('aria-expanded="true"')
  })

  it('renders a localized empty state when no response body properties match', () => {
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
                properties: { name: { type: 'string' } },
              },
            },
          },
        },
      },
    }

    const markup = renderToStaticMarkup(<ResponseList operation={operation} spec={spec} query="unmatched" />)

    expect(markup).toContain('No response body properties match the current search.')
  })
})
