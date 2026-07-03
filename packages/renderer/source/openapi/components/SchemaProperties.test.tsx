import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { OpenAPIOperation, OpenAPISpec } from '../lib/utils'

import { EndpointPath } from './OpenApiOperation'
import { ParameterList, ResponseList } from './SchemaProperties'

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
