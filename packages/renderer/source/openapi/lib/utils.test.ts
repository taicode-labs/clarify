import { describe, expect, it } from 'vitest'

import { getOpenApiOperationEntry, getOpenApiOperationEntryById, getOpenApiOperationSectionId, listOpenApiOperations, type OpenAPISpec } from './utils'

describe('OpenAPI operation section ids', () => {
  it('normalizes section ids when listing operations from a raw spec', () => {
    const spec: OpenAPISpec = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            operationId: 'listPets',
            responses: { 200: { description: 'OK' } },
          },
        },
      },
    }

    const [entry] = listOpenApiOperations(spec)

    expect(getOpenApiOperationSectionId(entry.operation)).toBe('listPets')
  })

  it('normalizes section ids when resolving a single operation from a raw spec', () => {
    const spec: OpenAPISpec = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/pets/{petId}': {
          patch: {
            responses: { 204: { description: 'Updated' } },
          },
        },
      },
    }

    const entry = getOpenApiOperationEntry(spec, '/pets/{petId}', 'patch')

    expect(entry?.source).toBe('path')
    expect(entry ? getOpenApiOperationSectionId(entry.operation) : '').toBe('patch-petspetid')
  })

  it('resolves webhook operations through the same normalized entry path', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      webhooks: {
        pageLifecycle: {
          post: {
            operationId: 'pageLifecycleWebhook',
            responses: { 204: { description: 'Accepted' } },
          },
        },
      },
    } as OpenAPISpec

    const entry = getOpenApiOperationEntry(spec, 'pageLifecycle', 'post')

    expect(entry?.source).toBe('webhook')
    expect(entry ? getOpenApiOperationSectionId(entry.operation) : '').toBe('pageLifecycleWebhook')
  })

  it('resolves a unique operation by operationId', () => {
    const spec: OpenAPISpec = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/pets': {
          get: { operationId: 'listPets', responses: { 200: { description: 'OK' } } },
        },
      },
    }

    expect(getOpenApiOperationEntryById(spec, 'listPets')).toMatchObject({ path: '/pets', method: 'get', source: 'path' })
  })

  it('does not resolve duplicate operationIds', () => {
    const spec: OpenAPISpec = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/pets': { get: { operationId: 'listItems', responses: { 200: { description: 'OK' } } } },
        '/users': { get: { operationId: 'listItems', responses: { 200: { description: 'OK' } } } },
      },
    }

    expect(getOpenApiOperationEntryById(spec, 'listItems')).toBeUndefined()
  })

  it('orders configured operation IDs first and appends the rest in stable order', () => {
    const spec: OpenAPISpec = {
      openapi: '3.1.0',
      info: { title: 'Assets API', version: '1.0.0' },
      paths: {
        '/assets': {
          get: { operationId: 'listAssets', responses: { 200: { description: 'OK' } } },
          post: { operationId: 'createAsset', responses: { 201: { description: 'Created' } } },
        },
        '/assets/{assetId}': {
          get: { operationId: 'getAsset', responses: { 200: { description: 'OK' } } },
          delete: { operationId: 'deleteAsset', responses: { 204: { description: 'Deleted' } } },
        },
      },
    }

    const entries = listOpenApiOperations(spec, ['createAsset', 'getAsset'])

    expect(entries.map(({ operation }) => operation.operationId)).toEqual([
      'createAsset',
      'getAsset',
      'listAssets',
      'deleteAsset',
    ])
  })
})
