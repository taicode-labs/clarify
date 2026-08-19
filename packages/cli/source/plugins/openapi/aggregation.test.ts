import { describe, expect, it } from 'vitest'

import type { OpenAPISpec } from '../../types.js'

import { aggregateOpenAPISources, type OpenAPISourceDocument } from './aggregation.js'

const info = { title: 'Platform API', description: 'All endpoints.' }

function source(id: string, document: Record<string, unknown>): OpenAPISourceDocument {
  return {
    id,
    filePath: `/tmp/${id}.openapi.json`,
    document: document as OpenAPISpec,
  }
}

type AggregatedSpecFixture = {
  paths: Record<string, Record<string, Record<string, unknown>>>
  components: { securitySchemes: Record<string, unknown> }
}

describe('OpenAPI source aggregation', () => {
  it('creates an empty specification when no sources are available', () => {
    expect(aggregateOpenAPISources([], info)).toEqual({
      openapi: '3.1.0',
      info: { ...info, version: '1.0.0' },
      paths: {},
    })
  })

  it('merges paths, components, and tags from compatible sources', () => {
    const spec = aggregateOpenAPISources([
      source('users', {
        openapi: '3.1.0',
        info: { title: 'Users', version: '1.0.0' },
        paths: { '/users': { get: { responses: { 200: { description: 'OK' } } } } },
        components: { schemas: { User: { type: 'object' } } },
        tags: [{ name: 'Users' }],
      }),
      source('projects', {
        openapi: '3.1.1',
        info: { title: 'Projects', version: '1.0.0' },
        paths: { '/projects': { get: { responses: { 200: { description: 'OK' } } } } },
        components: { schemas: { Project: { type: 'object' } } },
        tags: [{ name: 'Projects' }],
      }),
    ], info)

    expect(spec.info).toEqual({ ...info, version: '1.0.0' })
    expect(spec.paths).toEqual({
      '/users': { get: { responses: { 200: { description: 'OK' } } } },
      '/projects': { get: { responses: { 200: { description: 'OK' } } } },
    })
    expect(spec.components?.schemas).toEqual({ User: { type: 'object' }, Project: { type: 'object' } })
    expect(spec.tags).toEqual([{ name: 'Users' }, { name: 'Projects' }])
  })

  it('preserves server and authentication contexts per service', () => {
    const service = (title: string, path: string, server: string, scheme: Record<string, unknown>) => ({
      openapi: '3.1.0',
      info: { title, version: '1.0.0' },
      servers: [{ url: server }],
      security: [{ auth: [] }],
      paths: {
        [path]: {
          get: { responses: { 200: { description: 'OK' } } },
          post: { servers: [{ url: `${server}/write` }], security: [], responses: { 200: { description: 'OK' } } },
        },
      },
      components: { securitySchemes: { auth: scheme } },
    })

    const spec = aggregateOpenAPISources([
      source('users', service('Users', '/users', 'https://users.example.com', { type: 'http', scheme: 'bearer' })),
      source('billing', service('Billing', '/invoices', 'https://billing.example.com', { type: 'apiKey', in: 'header', name: 'X-API-Key' })),
    ], info) as unknown as AggregatedSpecFixture

    expect(spec.paths['/users'].get).toMatchObject({ servers: [{ url: 'https://users.example.com' }], security: [{ auth: [] }] })
    expect(spec.paths['/users'].post).toMatchObject({ servers: [{ url: 'https://users.example.com/write' }], security: [] })
    expect(spec.paths['/invoices'].get).toMatchObject({ servers: [{ url: 'https://billing.example.com' }], security: [{ billing__auth: [] }] })
    expect(spec.components.securitySchemes).toEqual({
      auth: { type: 'http', scheme: 'bearer' },
      billing__auth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    })
  })

  it('inherits path servers and preserves operation authentication overrides', () => {
    const spec = aggregateOpenAPISources([source('jobs', {
      openapi: '3.1.0',
      info: { title: 'Service', version: '1.0.0' },
      servers: [{ url: 'https://fallback.example.com' }],
      security: [{ apiKey: [] }],
      paths: {
        '/jobs': {
          servers: [{ url: 'https://jobs.example.com' }],
          get: { security: [{ oauth: ['jobs:read'] }], responses: { 200: { description: 'OK' } } },
        },
      },
      components: {
        securitySchemes: {
          apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
          oauth: { type: 'oauth2', flows: {} },
        },
      },
    })], info) as unknown as AggregatedSpecFixture

    expect(spec.paths['/jobs'].get).toMatchObject({
      servers: [{ url: 'https://jobs.example.com' }],
      security: [{ oauth: ['jobs:read'] }],
    })
    expect(Object.keys(spec.paths['/jobs'])).toEqual(['get'])
  })

  it('rejects incompatible versions and conflicting entries', () => {
    const document = (version: string, path: string, description: string) => ({
      openapi: version,
      info: { title: path, version: '1.0.0' },
      paths: { [path]: { get: { responses: { 200: { description } } } } },
    })

    expect(() => aggregateOpenAPISources([
      source('v3', document('3.0.3', '/users', 'OK')),
      source('v31', document('3.1.0', '/projects', 'OK')),
    ], info)).toThrow('incompatible versions')

    expect(() => aggregateOpenAPISources([
      source('first', document('3.1.0', '/users', 'First')),
      source('second', document('3.1.1', '/users', 'Second')),
    ], info)).toThrow('conflicting paths entry "/users"')
  })
})
