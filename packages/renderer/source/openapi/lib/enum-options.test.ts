import { describe, expect, it } from 'vitest'

import { getEnumOptions } from './enum-options'

describe('getEnumOptions', () => {
  it('preserves enum value types and creates distinct stable keys', () => {
    const options = getEnumOptions({ enum: [1, '1', true, 'true', null] })

    expect(options.map(({ value }) => value)).toEqual([1, '1', true, 'true', null])
    expect(new Set(options.map(({ key }) => key))).toHaveLength(options.length)
    expect(options.map(({ valueText }) => valueText)).toEqual(['1', '1', 'true', 'true', 'null'])
  })

  it('normalizes labels and array descriptions', () => {
    const options = getEnumOptions({
      enum: ['in_progress', 'done'],
      'x-enumLabels': ['In progress', 'Done'],
      'x-enumDescriptions': ['Work is underway.', 'Work is complete.'],
    })

    expect(options).toMatchObject([
      { value: 'in_progress', label: 'In progress', description: 'Work is underway.' },
      { value: 'done', label: 'Done', description: 'Work is complete.' },
    ])
  })

  it('supports value-keyed descriptions and common enum name extensions', () => {
    const options = getEnumOptions({
      enum: [0, 1],
      'x-enum-varnames': ['Pending', 'Ready'],
      'x-enumDescriptions': { 0: 'Not ready.', 1: 'Ready to use.' },
    })

    expect(options).toMatchObject([
      { value: 0, label: 'Pending', description: 'Not ready.' },
      { value: 1, label: 'Ready', description: 'Ready to use.' },
    ])
  })

  it('returns no options for schemas without enum values', () => {
    expect(getEnumOptions({ type: 'string' })).toEqual([])
  })
})
