import { describe, expect, it } from 'vitest'

import type { ExampleEntry, MediaTypeEntry } from '../types'

import { getResponseExampleBody } from './ExamplePanels'

describe('getResponseExampleBody', () => {
  it('returns no body for a response without content', () => {
    expect(getResponseExampleBody(undefined, undefined)).toBe('')
  })

  it('serializes an example when response content exists', () => {
    const content = { mediaType: 'application/json', value: {} } as MediaTypeEntry
    const example = { key: 'default', value: { accepted: true } } as ExampleEntry

    expect(getResponseExampleBody(content, example)).toBe('{\n  "accepted": true\n}')
  })

  it('filters a structured example by matching schema properties', () => {
    const content = {
      mediaType: 'application/json',
      value: {
        schema: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                postalCode: { type: 'string', description: 'Delivery postcode' },
                city: { type: 'string' },
              },
            },
            accepted: { type: 'boolean' },
          },
        },
      },
    } as MediaTypeEntry
    const example = {
      key: 'default',
      value: { user: { postalCode: '94107', city: 'San Francisco' }, accepted: true },
    } as ExampleEntry
    const spec = { openapi: '3.1.0', info: { title: 'Test', version: '1.0.0' }, paths: {} }

    expect(getResponseExampleBody(content, example, spec, 'pstl')).toBe('{\n  "user": {\n    "postalCode": "94107"\n  }\n}')
  })

  it('keeps only matching entries in object arrays', () => {
    const content = {
      mediaType: 'application/json',
      value: {
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              postalCode: { type: 'string' },
              city: { type: 'string' },
            },
          },
        },
      },
    } as MediaTypeEntry
    const example = {
      key: 'default',
      value: [{ postalCode: '94107', city: 'San Francisco' }, { city: 'Oakland' }],
    } as ExampleEntry
    const spec = { openapi: '3.1.0', info: { title: 'Test', version: '1.0.0' }, paths: {} }

    expect(getResponseExampleBody(content, example, spec, 'pstl')).toBe('[\n  {\n    "postalCode": "94107"\n  }\n]')
  })

  it('does not filter non-structured response examples', () => {
    const content = {
      mediaType: 'text/plain',
      value: { schema: { type: 'string' } },
    } as MediaTypeEntry
    const example = { key: 'default', value: 'accepted' } as ExampleEntry
    const spec = { openapi: '3.1.0', info: { title: 'Test', version: '1.0.0' }, paths: {} }

    expect(getResponseExampleBody(content, example, spec, 'missing')).toBe('accepted')
  })
})
