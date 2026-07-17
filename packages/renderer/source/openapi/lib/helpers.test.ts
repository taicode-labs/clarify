import { describe, expect, it } from 'vitest'

import type { OpenApiParameter } from '../types'

import { getParameterExampleEntries, getRequestExampleEntries } from './helpers'

describe('request examples', () => {
  const parameters: OpenApiParameter[] = [
    {
      name: 'tenant',
      in: 'query',
      examples: {
        personal: { summary: 'Personal account', value: 'personal' },
        enterprise: { summary: 'Enterprise account', value: 'enterprise' },
      },
    },
  ]

  it('reads examples from Parameter Objects', () => {
    expect(getParameterExampleEntries(parameters[0])).toEqual([
      { key: 'personal', title: 'Personal account', summary: 'Personal account', value: 'personal' },
      { key: 'enterprise', title: 'Enterprise account', summary: 'Enterprise account', value: 'enterprise' },
    ])
  })

  it('combines matching parameter and request body example keys', () => {
    expect(getRequestExampleEntries(parameters, {
      examples: {
        personal: { summary: 'Create a personal user', value: { name: 'Alice' } },
        enterprise: { summary: 'Create an enterprise user', value: { name: 'Acme' } },
      },
    })).toEqual([
      { key: 'personal', title: 'Create a personal user', summary: 'Create a personal user', value: { name: 'Alice' } },
      { key: 'enterprise', title: 'Create an enterprise user', summary: 'Create an enterprise user', value: { name: 'Acme' } },
    ])
  })

  it('does not expose generated schema values as named request examples', () => {
    expect(getRequestExampleEntries([], { schema: { type: 'object', properties: { name: { type: 'string' } } } })).toEqual([])
  })
})
