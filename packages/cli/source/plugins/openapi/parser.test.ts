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

describe('operation deprecation metadata', () => {
  it('preserves deprecation through filtering and ordering for paths and webhooks', () => {
    const spec: OpenAPISpec = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/pets': {
          get: { operationId: 'old', deprecated: true, tags: ['Pets'], responses: {} },
          post: { operationId: 'active', deprecated: false, tags: ['Pets'], responses: {} },
          put: { operationId: 'unspecified', tags: ['Pets'], responses: {} },
          delete: { operationId: 'filtered', deprecated: true, tags: ['Other'], responses: {} },
        },
      },
      webhooks: {
        petCreated: {
          post: { operationId: 'oldWebhook', deprecated: true, tags: ['Pets'], responses: {} },
        },
      },
    }

    const sections = extractOpenAPISections(spec, ['Pets'], ['oldWebhook', 'old'])

    expect(sections.map(({ id, deprecated, badge }) => ({ id, deprecated, badge }))).toEqual([
      { id: 'unspecified', deprecated: undefined, badge: 'PUT' },
      { id: 'active', deprecated: undefined, badge: 'POST' },
      { id: 'oldWebhook', deprecated: true, badge: 'WEBHOOK' },
      { id: 'old', deprecated: true, badge: 'GET' },
    ])
  })

  it('moves deprecated operations to the end even when operationOrder puts them first', () => {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: { title: 'Pets', version: '1.0.0' },
      paths: {
        '/pets': {
          get: { operationId: 'listPets', summary: 'List pets', responses: {} },
          post: { operationId: 'legacyCreatePet', summary: 'Create pet (legacy)', deprecated: true, responses: {} },
        },
        '/pets/{id}': {
          get: { operationId: 'getPet', summary: 'Get pet', responses: {} },
          delete: { operationId: 'legacyDeletePet', summary: 'Delete pet (legacy)', deprecated: true, responses: {} },
        },
      },
    }

    const sections = extractOpenAPISections(spec, undefined, ['legacyDeletePet', 'legacyCreatePet', 'getPet', 'listPets'])

    expect(sections.map(section => section.id)).toEqual([
      'getPet',
      'listPets',
      'legacyDeletePet',
      'legacyCreatePet',
    ])
  })

  it('keeps spec order for deprecated operations when no operationOrder is configured', () => {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: { title: 'Pets', version: '1.0.0' },
      paths: {
        '/pets': {
          get: { operationId: 'legacyListPets', deprecated: true, responses: {} },
          post: { operationId: 'createPet', responses: {} },
          delete: { operationId: 'deletePet', responses: {} },
        },
      },
    }

    expect(extractOpenAPISections(spec).map(section => section.id)).toEqual([
      'createPet',
      'deletePet',
      'legacyListPets',
    ])
  })
})
