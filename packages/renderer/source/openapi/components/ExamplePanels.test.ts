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
})
